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
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message, Tag } from 'antd';
import { containerRouterPrefix } from '@/constant';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { getResourceQuotaList, deleteResourceQuota } from '@/api/containerApi';
import { Link, useHistory } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { solveResourceQuota, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function ResourceQuotaPage() {
  const [resourceQuotaForm] = Form.useForm();
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [resourceQuotaPage, setResourceQuotaPage] = useState(DEFAULT_CURRENT_PAGE);
  const [resourceQuotaListData, setResourceQuotaListData] = useState([]); // table
  const [resourceQuotaLoading, setResourceQuotaLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [resourceQuotaDelModalOpen, setResourceQuotaDelModalOpen] = useState(false); // 删除对话框展示
  const [resourceQuotaDelName, setResourceQuotaDelName] = useState(''); // 删除的名称
  const [resourceQuotaDelNamespace, setResourceQuotaDelNamespace] = useState('');
  const [isResourceQuotaDelCheck, setIsResourceQuotaDelCheck] = useState(false); // 是否选中
  const [filterResourceQuotaStatus, setFilterResourceQuotaStatus] = useState([]); // 赋值筛选项
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const themeStore = useStore('theme');
  const handleResourceQuotaOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const resourceQuotaColumns = [
    {
      title: '资源配额名称',
      key: 'resourceQuota_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/namespace/resourceQuota/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '命名空间',
      key: 'resourceQuota_namespace',
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '标签',
      key: 'resourceQuota_memory',
      width: 200,
      render: (_, record) => <div className="table_label">
        {record.metadata.labels ? Object.keys(record.metadata.labels).map(item =>
          (<Tag color='#CFE7FF' className="label_tag_key">{`${item}:${record.metadata.labels[item]}`}</Tag>)) : '--'}
      </div>,
    },
    {
      title: '项目注解',
      key: 'resourceQuota_cpu',
      width: 300,
      render: (_, record) => <div className="table_label">
        {record.metadata.annotations ? Object.keys(record.metadata.annotations).map(item =>
          (<Tag color='#CFE7FF' className="label_tag_key">{`${item}:${record.metadata.annotations[item]}`}</Tag>)) : '--'}
      </div>,
    },
    {
      title: '状态',
      filters: filterResourceQuotaStatus,
      filterMultiple: false,
      key: 'resourceQuota_status',
      width: 220,
      onFilter: (value, record) => value === 'exist' ? solveResourceQuota(record.status) === 'exist' : solveResourceQuota(record.status) === '',
      render: (_, record) => <div className={`status_group`}>
        <span className={solveResourceQuota(record.status) === 'exist' ? 'failed_circle' : 'running_circle'}></span>
        <span>{solveResourceQuota(record.status) === 'exist' ? '存在达到配额的资源' : '没有已达到配额的资源'}</span>
      </div>,
    },
    {
      title: '创建时间',
      key: 'resourceQuota_created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'resourceQuota_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement="bottom"
          content={
            <div className="pop_modal">
              <Button type="link"><Link to={`/${containerRouterPrefix}/namespace/resourceQuota/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
              <Button type="link" onClick={() => handleDeleteResourceQuota(record)}>删除</Button>
            </div>
          }
          trigger="click"
          open={popOpen === record.metadata.uid}
          onOpenChange={e => handleResourceQuotaOpenChange(e, record)}>
          <MoreOutlined className="common_antd_icon primary_color" />
        </Popover>
      </Space>,
    },
  ];

  const getResourceQuotaListData = useCallback(async (isChange = true) => {
    setResourceQuotaLoading(true);
    try {
      const res = await getResourceQuotaList(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchResourceQuota(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setResourceQuotaListData([]); // 数组为空
      }
    }
    setResourceQuotaLoading(false);
  }, [namespace]);

  // 重置按钮
  const handleResourceQuotaReset = () => {
    getResourceQuotaListData(false);
  };

  // 删除按钮
  const handleDeleteResourceQuota = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setResourceQuotaDelModalOpen(true); // 打开弹窗
    setResourceQuotaDelName(record.metadata.name);
    setResourceQuotaDelNamespace(record.metadata.namespace);
    setIsResourceQuotaDelCheck(false);
  };

  const handleDelResourceQuotaCancel = () => {
    setResourceQuotaDelModalOpen(false);
    setResourceQuotaDelName('');
    setResourceQuotaDelNamespace('');
  };

  const handleDelResourceQuotaConfirm = async () => {
    try {
      const res = await deleteResourceQuota(resourceQuotaDelNamespace, resourceQuotaDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setResourceQuotaDelModalOpen(false);
        setResourceQuotaDelName('');
        setIsResourceQuotaDelCheck(false);
        setResourceQuotaDelNamespace('');
        getResourceQuotaListData();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  // 检索
  const handleSearchResourceQuota = (totalData = originalList, isChange = true) => {
    const resourceQuotaFormName = resourceQuotaForm.getFieldValue('resourceQuota_name');
    let temporyList = totalData;
    if (resourceQuotaFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(resourceQuotaFormName.toLowerCase()));
    }
    setResourceQuotaListData([...temporyList]);
    isChange ? setResourceQuotaPage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleResourceQuotaCheckFn = (e) => {
    setIsResourceQuotaDelCheck(e.target.checked);
  };

  useEffect(() => {
    getResourceQuotaListData();
  }, [getResourceQuotaListData]);

  useEffect(() => {
    // 赋值
    setFilterResourceQuotaStatus([
      { text: '存在达到配额的资源', value: 'exist' },
      { text: '没有已达到配额的资源', value: 'cantExist' }],
    );
  }, []);
  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={
      [{ title: '命名空间', path: `/${containerRouterPrefix}/namespace/resourceQuota` }, { title: 'ResourceQuota', path: '/' }]} />
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={resourceQuotaForm}>
        <Form.Item name="resourceQuota_name" className="search_input">
          <Input.Search placeholder="搜索资源配额名称" onSearch={() => handleSearchResourceQuota()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/namespace/resourceQuota/createResourceQuota`)}>创建</Button>
            <Button icon={<SyncOutlined />} onClick={handleResourceQuotaReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex cluster_container_height">
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding"
            loading={resourceQuotaLoading}
            columns={resourceQuotaColumns}
            dataSource={resourceQuotaListData}
            pagination={{
              className: 'page',
              current: resourceQuotaPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setResourceQuotaPage(page),
            }}
            scroll={{ x: 1280 }}>
          </Table>
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除资源配额"
        open={resourceQuotaDelModalOpen}
        cancelFn={handleDelResourceQuotaCancel}
        content={[
          '删除资源配额后将无法恢复，请谨慎操作。',
          `确定删除资源配额 ${resourceQuotaDelName} 吗？`,
        ]}
        isCheck={isResourceQuotaDelCheck}
        showCheck={true}
        checkFn={handleResourceQuotaCheckFn}
        confirmFn={handleDelResourceQuotaConfirm} />
    </div>
  </div>;
}