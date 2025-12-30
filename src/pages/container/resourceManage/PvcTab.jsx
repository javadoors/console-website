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
import { getPvcData, deletePvc } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import '@/styles/pages/resourceManage.less';
import { sortResourceByTime } from '@/utils/common';
import { sorterFirstAlphabet, sorterStorage, forbiddenMsg } from '@/tools/utils';

export default function PvcTab() {
  const [pvcForm] = Form.useForm();

  const namespace = useContext(NamespaceContext);

  const history = useHistory();

  const [pvcTotal, setPvcTotal] = useState(0);

  const [pvcList, setPvcList] = useState([]);

  const [pvcLoading, setPvcLoading] = useState(false); // 加载中

  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [pvcIndexDeleteModal, setPvcIndexDeleteModal] = useState(false);

  const [isPvcIndexCheck, setIsPvcIndexCheck] = useState(false);

  const [pvcIndexDeleteName, setPvcIndexDeleteName] = useState('');

  const [pvcDelNamespace, setPvcDelNamespace] = useState(''); // 删除的命名空间

  const [messageApi, contextHolder] = message.useMessage();

  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handlePvcReset = () => {
    getPvcList();
  };

  const handleDeletePvc = (record) => {
    setPopOpen('');
    setIsPvcIndexCheck(false);
    setPvcIndexDeleteModal(true);
    setPvcIndexDeleteName(record.metadata.name);
    setPvcDelNamespace(record.metadata.namespace);
  };

  // model的删除按钮
  const handlePvcIndexConfirmDelete = async () => {
    try {
      const res = await deletePvc(pvcDelNamespace, pvcIndexDeleteName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setPvcIndexDeleteModal(false);
        setIsPvcIndexCheck(false);
        setPvcDelNamespace('');
        getPvcList();
      }
    } catch (pvcError) {
      if (pvcError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, pvcError);
      } else {
        messageApi.error(`删除失败!${pvcError.response.data.message}`);
      }
    }
  };

  // model的取消按钮
  const pvcIndexCancelModal = () => {
    setPvcIndexDeleteModal(false);
    setPvcDelNamespace('');
  };

  // 接受check回调
  const recieveCheck = (e) => {
    setIsPvcIndexCheck(e.target.checked);
  };

  // 列表项
  const PvcColumns = [
    {
      title: '数据卷声明(PVC)名称',
      key: 'pvc_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Space>
        <Link to={`/${containerRouterPrefix}/resourceManagement/pvc/PvcDetail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>
      </Space>,
    },
    {
      title: '容量',
      key: 'pvc_capacity',
      sorter: (a, b) => sorterStorage(a.spec.resources.requests.storage, b.spec.resources.requests.storage),
      render: (_, record) => <Space>
        {record.spec?.resources?.requests?.storage ? record.spec.resources.requests.storage : '--'}
      </Space>,
    },
    {
      title: '命名空间',
      key: 'pvc_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => <Space>
        {record.metadata?.namespace ? record.metadata.namespace : '--'}
      </Space>,
    },
    {
      title: '关联存储池(SC)',
      key: 'pvc_sc',
      render: (_, record) => <Space>
        {record.spec?.storageClassName ? record.spec.storageClassName : '--'}
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
            <Button type="link"><Link to={`/${containerRouterPrefix}/resourceManagement/pvc/PvcDetail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
            <Button type="link" onClick={() => handleDeletePvc(record)}>删除</Button></div>
          } trigger="click" open={popOpen === record.metadata.uid} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取pvcList
  const getPvcList = useCallback(async () => {
    setPvcLoading(true);
    try {
      const res = await getPvcData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        if (pvcForm.getFieldValue('pvc_name')) {
          handleSearchPvc(res.data.items);
        } else {
          setPvcList([...res.data.items]);
          setPvcTotal(res.data.items.length);
        }
      }
    } catch (e) {
      setPvcList([]);
      setPvcTotal(0);
    }
    setPvcLoading(false);
  }, [namespace]);

  const handleSearchPvc = (totalData = originalList) => {
    const pvcFormName = pvcForm.getFieldValue('pvc_name');
    let temporyList = [];
    if (pvcFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(pvcFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setPvcList([...temporyList]);
    setPvcTotal(temporyList.length);
  };

  useEffect(() => {
    getPvcList();
  }, [getPvcList]);

  return <div className="resource-storge-tab-container">
    {contextHolder}
    <Form className="resource-storge-searchForm form_padding_bottom" form={pvcForm}>
      <Form.Item name="pvc_name" className="resource-storge-search-input">
        <Input.Search placeholder="搜索数据卷声明名称" onSearch={() => handleSearchPvc()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/resourceManagement/pvc/createPvc`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handlePvcReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={pvcLoading}
          columns={PvcColumns}
          dataSource={pvcList}
          pagination={{
            className: 'page',
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            total: pvcTotal,
            pageSizeOptions: [10, 20, 50],
          }}
        >
        </Table>
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除数据卷声明"
      open={pvcIndexDeleteModal}
      cancelFn={pvcIndexCancelModal}
      content={[
        '删除数据卷声明后无法恢复，请谨慎操作。',
        `确定删除数据卷声明 ${pvcIndexDeleteName} 吗？`,
      ]}
      isCheck={isPvcIndexCheck}
      showCheck={true}
      checkFn={recieveCheck}
      confirmFn={handlePvcIndexConfirmDelete}
    />
  </div>;
}