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
import { getPvData, deletePv } from '@/api/containerApi';
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

export default function PvTab() {
  const [pvForm] = Form.useForm();

  const namespace = useContext(NamespaceContext);

  const history = useHistory();

  const [pvTotal, setPvTotal] = useState(0);

  const [pvList, setPvList] = useState([]);

  const [pvLoading, setPvLoading] = useState(false); // 加载中

  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [pvIndexDeleteModal, setPvIndexDeleteModal] = useState(false);

  const [isPvIndexCheck, setIsPvIndexCheck] = useState(false);

  const [pvIndexDeleteName, setPvIndexDeleteName] = useState('');

  const [pvDelNamespace, setPvDelNamespace] = useState(''); // 删除的命名空间

  const [messageApi, contextHolder] = message.useMessage();

  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handlePvReset = () => {
    getPvList();
  };

  const handleDeletePv = (record) => {
    if (record.status.phase === 'Bound') {
      messageApi.error(`请先删除${record.metadata.name}关联的数据卷声明`);
    } else {
      setPopOpen('');
      setIsPvIndexCheck(false);
      setPvIndexDeleteModal(true);
      setPvIndexDeleteName(record.metadata.name);
      setPvDelNamespace(record.metadata.namespace);
    }
  };

  // model的删除按钮
  const handlePvIndexConfirmDelete = async () => {
    try {
      const res = await deletePv(pvIndexDeleteName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setPvIndexDeleteModal(false);
        setIsPvIndexCheck(false);
        setPvDelNamespace('');
        getPvList();
      }
    } catch (pvError) {
      if (pvError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, pvError);
      } else {
        messageApi.error(`删除失败!${pvError.response.data.message}`);
      }
    }
  };

  // model的取消按钮
  const pvIndexCancelModal = () => {
    setPvIndexDeleteModal(false);
    setPvDelNamespace('');
  };

  // 接受check回调
  const recieveCheck = (e) => {
    setIsPvIndexCheck(e.target.checked);
  };

  // 列表项
  const PvColumns = [
    {
      title: '数据卷(PV)名称',
      key: 'pv_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Space>
        <Link to={`/${containerRouterPrefix}/resourceManagement/pv/PvDetail/${record.metadata.name}`}>{record.metadata.name}</Link>
      </Space>,
    },
    {
      title: '容量',
      key: 'pv_capacity',
      sorter: (a, b) => sorterStorage(a.spec.capacity.storage, b.spec.capacity.storage),
      render: (_, record) => <Space>
        {record.spec?.capacity?.storage ? record.spec.capacity.storage : '--'}
      </Space>,
    },
    {
      title: '存储池',
      key: 'pv_sc',
      render: (_, record) => <Space>
        {record.spec?.storageClassName ? record.spec.storageClassName : '--'}
      </Space>,
    },
    {
      title: '绑定数据卷声明(PVC)',
      key: 'pv_pvc',
      render: (_, record) => <Space>
        {record.spec?.claimRef?.name ? record.spec.claimRef.name : '--'}
      </Space>,
    },
    {
      title: '创建时间',
      key: 'create_time',
      sorter: (a, b) => sortResourceByTime(a.metadata, b.metadata),
      render: (_, record) => <Space>
        {Dayjs(record.metadata?.creationTimestamp ? record.metadata?.creationTimestamp : '--').format('YYYY-MM-DD HH:mm')}
      </Space>,
    },
    {
      title: '操作',
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom" content={<div className="pop_modal">
            <Button type="link"><Link to={`/${containerRouterPrefix}/resourceManagement/pv/PvDetail/${record.metadata.name}/yaml`}>修改</Link></Button>
            {/* {record.status.phase !== 'Bound' ? <Button type="link" onClick={() => handleDeletePv(record)}>删除</Button> : null}</div> */}
            <Button type="link" onClick={() => handleDeletePv(record)}>删除</Button></div>
          } trigger="click" open={popOpen === record.metadata.uid} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取pvList
  const getPvList = useCallback(async () => {
    setPvLoading(true);
    try {
      const res = await getPvData();
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        if (pvForm.getFieldValue('pv_name')) {
          handleSearchPv(res.data.items);
        } else {
          setPvList([...res.data.items]);
          setPvTotal(res.data.items.length);
        }
      }
    } catch (e) {
      setPvList([]);
      setPvTotal(0);
    }
    setPvLoading(false);
  }, [namespace]);

  const handleSearchPv = (totalData = originalList) => {
    const pvFormName = pvForm.getFieldValue('pv_name');
    let temporyList = [];
    if (pvFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(pvFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setPvList([...temporyList]);
    setPvTotal(temporyList.length);
  };

  useEffect(() => {
    getPvList();
  }, [getPvList]);

  return <div className="resource-storge-tab-container">
    {contextHolder}
    <Form className="resource-storge-searchForm form_padding_bottom" form={pvForm}>
      <Form.Item name="pv_name" className="resource-storge-search-input">
        <Input.Search placeholder="搜索数据卷名称" onSearch={() => handleSearchPv()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/resourceManagement/pv/createPv`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handlePvReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={pvLoading}
          columns={PvColumns}
          dataSource={pvList}
          pagination={{
            className: 'page',
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            total: pvTotal,
            pageSizeOptions: [10, 20, 50],
          }}
        >
        </Table>
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除数据卷"
      open={pvIndexDeleteModal}
      cancelFn={pvIndexCancelModal}
      content={[
        '删除数据卷后无法恢复，请谨慎操作。',
        `确定删除数据卷 ${pvIndexDeleteName} 吗？`,
      ]}
      isCheck={isPvIndexCheck}
      showCheck={true}
      checkFn={recieveCheck}
      confirmFn={handlePvIndexConfirmDelete}
    />
  </div>;
}