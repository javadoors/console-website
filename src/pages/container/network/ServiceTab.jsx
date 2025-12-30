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
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { getServicesData, deleteService } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function ServiceTab() {
  const [serviceForm] = Form.useForm();
  const themeStore = useStore('theme');

  const namespace = useContext(NamespaceContext);

  const history = useHistory();

  const [serviceTotal, setServiceTotal] = useState(0);

  const [serviceList, setServiceList] = useState([]); // 数据集

  const [serviceLoading, setServiceLoading] = useState(false);

  const [popOpen, setPopOpen] = useState('');

  const [serviceIndexDeleteModal, setServiceIndexDeleteModal] = useState(false);

  const [isServiceIndexCheck, setIsServiceIndexCheck] = useState(false);

  const [serviceIndexDeleteName, setServiceIndexDeleteName] = useState('');

  const [serviceSortObj, setServiceSortObj] = useState({});

  const [serviceDelNamespace, setServiceDelNamespace] = useState(''); // 删除的命名空间

  const [messageApi, contextHolder] = message.useMessage();
  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handleServiceReset = () => {
    getServicesList();
  };

  const handleDeleteService = (record) => {
    setPopOpen('');
    setIsServiceIndexCheck(false);
    setServiceIndexDeleteModal(true);
    setServiceIndexDeleteName(record.metadata.name);
    setServiceDelNamespace(record.metadata.namespace);
  };

  // model删除
  const handleServiceIndexConfirmDelete = async () => {
    try {
      const res = await deleteService(serviceDelNamespace, serviceIndexDeleteName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setServiceIndexDeleteModal(false);
        setIsServiceIndexCheck(false);
        setServiceDelNamespace('');
        getServicesList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  // model取消
  const serviceIndexCancelModal = () => {
    setServiceIndexDeleteModal(false);
    setServiceDelNamespace('');
  };

  const recieveCheck = (e) => {
    setIsServiceIndexCheck(e.target.checked);
  };

  // 处理外部端口数据
  const filterNodePort = (value) => {
    let _nodePortArr = [];
    let newValue = '';
    value.forEach(item => {
      if (item.nodePort) {
        _nodePortArr.push(item.nodePort);
      }
    });
    if (_nodePortArr.length) {
      newValue = _nodePortArr.toString('');
    } else {
      newValue = '--';
    }
    return newValue;
  };

  // 列表项
  const serviceColumns = [
    {
      title: '服务名称',
      key: 'service_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Space>
        <Link to={`/${containerRouterPrefix}/network/service/ServiceDetail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>
      </Space>,
    },
    {
      title: '命名空间',
      key: 'service_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => <Space>
        {record.metadata.namespace}
      </Space>,
    },
    {
      title: '外部端口',
      key: 'service_port',
      sorter: (a, b) => sorterFirstAlphabet(filterNodePort(a.spec.ports), filterNodePort(b.spec.ports)),
      render: (_, record) => <Space>
        {filterNodePort(record.spec.ports)}
      </Space>,
    },
    {
      title: '内部IP地址',
      key: 'service_ip',
      sorter: (a, b) => sorterFirstAlphabet(a.spec.clusterIP, b.spec.clusterIP),
      render: (_, record) => <Space>
        {record.spec.clusterIP !== 'None' ? record.spec.clusterIP : '--'}
      </Space>,
    },
    {
      title: '创建时间',
      key: 'create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
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
            <Button type="link"><Link to={`/${containerRouterPrefix}/network/service/ServiceDetail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
            <Button type="link" onClick={() => handleDeleteService(record)}>删除</Button></div>
          } trigger="click" open={popOpen === record.metadata.uid} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取serviceList
  const getServicesList = useCallback(async () => {
    setServiceLoading(true);
    try {
      const res = await getServicesData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        if (serviceForm.getFieldValue('service_name')) {
          handleSearchService(res.data.items);
        } else {
          setServiceList([...res.data.items]);
          setServiceTotal(res.data.items.length);
        }
      }
    } catch {
      setServiceList([]);
      setServiceTotal(0);
    }
    setServiceLoading(false);
  }, [namespace]);

  const handleSearchService = (totalData = originalList) => {
    const serviceFormName = serviceForm.getFieldValue('service_name');
    let temporyList = [];
    if (serviceFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(serviceFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setServiceList([...temporyList]);
    setServiceTotal(temporyList.length);
  };

  useEffect(() => {
    getServicesList();
  }, [getServicesList]);

  return <div className="network-tab-container">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="network-searchForm form_padding_bottom" form={serviceForm}>
      <Form.Item name="service_name" className="network-search-input">
        <Input.Search placeholder="搜索Service名称" onSearch={() => handleSearchService()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/network/service/createService`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleServiceReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={serviceLoading}
          columns={serviceColumns}
          dataSource={serviceList}
          pagination={{
            className: 'page',
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            total: serviceTotal,
            pageSizeOptions: [10, 20, 50],
          }}>
        </Table>
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除Service"
      open={serviceIndexDeleteModal}
      cancelFn={serviceIndexCancelModal}
      content={[
        '删除Service后无法恢复，请谨慎操作。',
        `确定删除Service ${serviceIndexDeleteName} 吗？`,
      ]}
      isCheck={isServiceIndexCheck}
      showCheck={true}
      checkFn={recieveCheck}
      confirmFn={handleServiceIndexConfirmDelete}
    />
  </div>;
}