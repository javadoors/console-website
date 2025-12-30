/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button, Form, Space, Input, Table, ConfigProvider, Popover, message } from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode, deploymentStatus } from '@/common/constants';
import { getDeploymentsData, deleteDeployment } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { getWorkloadStatusJudge, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function DeploymentTab() {
  const themeStore = useStore('theme');
  const [deploymentForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();

  const namespace = useContext(NamespaceContext);

  const [messageApi, contextHolder] = message.useMessage();
  const [deploymentList, setDeploymentList] = useState([]); // 数据集
  const [deploymentPage, setDeploymentPage] = useState(DEFAULT_CURRENT_PAGE); // 分页
  const [deploymentLoading, setDeploymentLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [filterDeploymentStatus, setFilterDeploymentStatus] = useState([]); // 赋值筛选项
  const [deploymentDelModalOpen, setDeploymentDelModalOpen] = useState(false); // 删除对话框展示
  const [deploymentDelName, setDeploymentDelName] = useState(''); // 删除的名称
  const [deploymentDelNamespace, setDeploymentDelNamespace] = useState('');
  const [isDeploymentDelCheck, setIsDeploymentDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterDeploymentValue, setFilterDeploymentValue] = useState(); // 筛选值

  // 重置按钮
  const handleDeploymentReset = () => {
    getDeploymentsList(false);
  };

  // 删除按钮
  const handleDeleteDeployment = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setDeploymentDelModalOpen(true); // 打开弹窗
    setDeploymentDelName(record.metadata.name);
    setDeploymentDelNamespace(record.metadata.namespace);
    setIsDeploymentDelCheck(false);
  };

  const handleDelDeploymentCancel = () => {
    setDeploymentDelModalOpen(false);
    setDeploymentDelName('');
    setDeploymentDelNamespace('');
  };

  const handleDelDeploymentConfirm = async () => {
    try {
      const res = await deleteDeployment(deploymentDelNamespace, deploymentDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setDeploymentDelModalOpen(false);
        setIsDeploymentDelCheck(false);
        setDeploymentDelName('');
        setDeploymentDelNamespace('');
        getDeploymentsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleDeploymentTabCheckFn = (e) => {
    setIsDeploymentDelCheck(e.target.checked);
  };

  const handleDeploymentOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const deploymentColumns = [
    {
      title: '负载名称',
      key: 'deployment_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/deployment/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterDeploymentStatus,
      filterMultiple: false,
      filteredValue: filterDeploymentValue ? [filterDeploymentValue] : [],
      onFilter: (value, record) => getWorkloadStatusJudge(record.status).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(getWorkloadStatusJudge(a.status), getWorkloadStatusJudge(b.status)),
      key: 'deploymentStatus',
      width: 220,
      render: (_, record) => <p className={`resource_status ${getWorkloadStatusJudge(record.status).toLowerCase()}_circle`}>
        {getWorkloadStatusJudge(record.status)}
      </p>,
    },
    {
      title: '命名空间',
      key: 'deployment_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '实例（正常/总量）',
      key: 'deployment_example',
      render: (_, record) => `${record.status.readyReplicas || 0}/${record.status.replicas || 0}`,
    },
    {
      title: '创建时间',
      key: 'deployment_create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'handle',
      fixed: 'right',
      width: 120,
      title: '操作',
      render: (_, record) => (
        <Space>
          <Popover
            className='DeploymentTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/deployment/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteDeployment(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleDeploymentOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取deploymentList
  const getDeploymentsList = useCallback(async (isChange = true) => {
    setDeploymentLoading(true);
    try {
      const res = await getDeploymentsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchDeployment(res.data.items, isChange);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setDeploymentList([]); // 数组为空
      }
    }
    setDeploymentLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchDeployment = (totalData = originalList, isChange = true) => {
    const deploymentFormName = deploymentForm.getFieldValue('deployment_name');
    let temporyList = totalData;
    if (deploymentFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(deploymentFormName.toLowerCase()));
    }
    setDeploymentList([...temporyList]);
    isChange ? setDeploymentPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    const statusKey = Object.keys(deploymentStatus);
    statusKey.map(item => {
      statusArr.push({ text: item, value: deploymentStatus[item] });
    });
    setFilterDeploymentStatus([...statusArr]);
  }, []);

  const handleDeploymentTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterDeploymentValue(filter.deploymentStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterDeploymentValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getDeploymentsList();
  }, [getDeploymentsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={deploymentForm}>
      <Form.Item name="deployment_name" className="pod_search_input">
        <Input.Search placeholder="搜索负载名称" onSearch={() => handleSearchDeployment()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/deployment/createDeployment`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleDeploymentReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={deploymentLoading}
          columns={deploymentColumns}
          dataSource={deploymentList}
          onChange={handleDeploymentTableChange}
          pagination={{
            className: 'page',
            current: deploymentPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setDeploymentPage(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除Deployment"
      open={deploymentDelModalOpen}
      cancelFn={handleDelDeploymentCancel}
      content={[
        '删除Deployment后将无法恢复，请谨慎操作。',
        `确定删除Deployment ${deploymentDelName} 吗？`,
      ]}
      isCheck={isDeploymentDelCheck}
      showCheck={true}
      checkFn={handleDeploymentTabCheckFn}
      confirmFn={handleDelDeploymentConfirm} />
  </div>;
}