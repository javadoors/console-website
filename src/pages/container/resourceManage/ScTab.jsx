/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { Button, Form, Space, Input, Table, ConfigProvider, Popover, message } from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext } from 'openinula';
import { getScData, deleteSc } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import '@/styles/pages/resourceManage.less';
import { sortResourceByTime } from '@/utils/common';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function ScTab() {
  const [scForm] = Form.useForm();

  const namespace = useContext(NamespaceContext);

  const history = useHistory();

  const [scTotal, setScTotal] = useState(0);

  const [scList, setScList] = useState([]);

  const [scLoading, setScLoading] = useState(false); // 加载中

  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [scIndexDeleteModal, setScIndexDeleteModal] = useState(false);

  const [isScIndexCheck, setIsScIndexCheck] = useState(false);

  const [scIndexDeleteName, setScIndexDeleteName] = useState('');

  const [scDelNamespace, setScDelNamespace] = useState(''); // 删除的命名空间

  const [messageApi, contextHolder] = message.useMessage();

  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handleScReset = () => {
    getScList();
  };

  const handleDeleteSc = (record) => {
    setPopOpen('');
    setIsScIndexCheck(false);
    setScIndexDeleteModal(true);
    setScIndexDeleteName(record.metadata.name);
    setScDelNamespace(record.metadata.namespace);
  };

  // model的删除按钮
  const handleScIndexConfirmDelete = async () => {
    try {
      const res = await deleteSc(scIndexDeleteName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setScIndexDeleteModal(false);
        setIsScIndexCheck(false);
        setScDelNamespace('');
        getScList();
      }
    } catch (scError) {
      if (scError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, scError);
      } else {
        messageApi.error(`删除失败!${scError.response.data.message}`);
      }
    }
  };

  // model的取消按钮
  const scIndexCancelModal = () => {
    setScIndexDeleteModal(false);
    setScDelNamespace('');
  };

  // 接受check回调
  const recieveCheck = (e) => {
    setIsScIndexCheck(e.target.checked);
  };

  // 列表项
  const ScColumns = [
    {
      title: '存储池(SC)名称',
      key: 'sc_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Space>
        <Link to={`/${containerRouterPrefix}/resourceManagement/sc/ScDetail/${record.metadata.name}`}>{record.metadata.name}</Link>
      </Space>,
    },
    {
      title: '存储提供者',
      key: 'sc_provider',
      render: (_, record) => <Space>
        {record.provisioner ? record.provisioner : '--'}
      </Space>,
    },
    {
      title: '回收策略',
      key: 'sc_strategy',
      render: (_, record) => <Space>
        {record.reclaimPolicy ? record.reclaimPolicy : '--'}
      </Space>,
    },
    {
      title: '创建时间',
      key: 'create_time',
      sorter: (a, b) => sortResourceByTime(a.metadata, b.metadata),
      render: (_, record) => <Space>
        {Dayjs(record.metadata.creationTimestamp ? record.metadata.creationTimestamp : '--').format('YYYY-MM-DD HH:mm')}
      </Space>,
    },
    {
      title: '操作',
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom" content={<div className="pop_modal">
            <Button type="link"><Link to={`/${containerRouterPrefix}/resourceManagement/sc/ScDetail/${record.metadata.name}/yaml`}>修改</Link></Button>
            <Button type="link" onClick={() => handleDeleteSc(record)}>删除</Button></div>
          } trigger="click" open={popOpen === record.metadata.uid} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取scList
  const getScList = useCallback(async () => {
    setScLoading(true);
    try {
      const res = await getScData();
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        if (scForm.getFieldValue('sc_name')) {
          handleSearchSc(res.data.items);
        } else {
          setScList([...res.data.items]);
          setScTotal(res.data.items.length);
        }
      }
    } catch (e) {
      setScList([]);
      setScTotal(0);
    }
    setScLoading(false);
  }, [namespace]);

  const handleSearchSc = (totalData = originalList) => {
    const scFormName = scForm.getFieldValue('sc_name');
    let temporyList = [];
    if (scFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(scFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setScList([...temporyList]);
    setScTotal(temporyList.length);
  };

  useEffect(() => {
    getScList();
  }, [getScList]);

  return <div className="resource-storge-tab-container">
    {contextHolder}
    <Form className="resource-storge-searchForm form_padding_bottom" form={scForm}>
      <Form.Item name="sc_name" className="resource-storge-search-input">
        <Input.Search placeholder="搜索存储池名称" onSearch={() => handleSearchSc()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/resourceManagement/sc/createSc`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleScReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={scLoading}
          columns={ScColumns}
          dataSource={scList}
          pagination={{
            className: 'page',
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            total: scTotal,
            pageSizeOptions: [10, 20, 50],
          }}
        >
        </Table>
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除存储池"
      open={scIndexDeleteModal}
      cancelFn={scIndexCancelModal}
      content={[
        '删除存储池后无法恢复，请谨慎操作。',
        `确定删除存储池 ${scIndexDeleteName} 吗？`,
      ]}
      isCheck={isScIndexCheck}
      showCheck={true}
      checkFn={recieveCheck}
      confirmFn={handleScIndexConfirmDelete}
    />
  </div>;
}