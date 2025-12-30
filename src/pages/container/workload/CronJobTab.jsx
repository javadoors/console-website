/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button, Form, Space, Input, Table, Pagination, ConfigProvider, Popover, message } from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useLayoutEffect, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, ResponseCode, cronJobStatus } from '@/common/constants';
import { getCronJobsData, deleteCronJob } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { getCronJobStatus, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function CronJobTab() {
  const themeStore = useStore('theme');
  const [cronJobForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();
  const namespace = useContext(NamespaceContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [cronJobPage, setCronJobPage] = useState(DEFAULT_CURRENT_PAGE);
  const [cronJobList, setCronJobList] = useState([]); // 数据集
  const [cronJobLoading, setCronJobLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [filterCronJobStatus, setFilterCronJobStatus] = useState([]); // 赋值筛选项

  const [cronJobDelModalOpen, setCronJobDelModalOpen] = useState(false); // 删除对话框展示
  const [cronJobDelName, setCronJobDelName] = useState(''); // 删除的名称
  const [cronJobDelNamespace, setCronJobDelNamespace] = useState('');
  const [isCronJobDelCheck, setIsCronJobDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterCronJobValue, setFilterCronJobValue] = useState();

  // 重置按钮
  const handleCronJobReset = () => {
    getCronJobsList(false);
  };

  // 删除按钮
  const handleDeleteCronJob = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setCronJobDelModalOpen(true); // 打开弹窗
    setCronJobDelName(record.metadata.name);
    setCronJobDelNamespace(record.metadata.namespace);
    setIsCronJobDelCheck(false);
  };

  const handleDelCronJobCancel = () => {
    setCronJobDelModalOpen(false);
    setCronJobDelName('');
    setCronJobDelNamespace('');
  };

  const handleDelCronJobConfirm = async () => {
    try {
      const res = await deleteCronJob(cronJobDelNamespace, cronJobDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setCronJobDelModalOpen(false);
        setIsCronJobDelCheck(false);
        setCronJobDelName('');
        setCronJobDelNamespace('');
        getCronJobsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleCronJobTabCheckFn = (e) => {
    setIsCronJobDelCheck(e.target.checked);
  };

  const handleCronJobOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const cronJobColumns = [
    {
      title: '负载名称',
      key: 'cronJob_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/cronJob/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterCronJobStatus,
      filterMultiple: false,
      filteredValue: filterCronJobValue ? [filterCronJobValue] : [],
      onFilter: (value, record) => getCronJobStatus(record.status).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(getCronJobStatus(a.status), getCronJobStatus(b.status)),
      key: 'cronJobStatus',
      width: 220,
      render: (_, record) => <p className={`resource_status ${getCronJobStatus(record.status).toLowerCase()}_circle`}>
        {getCronJobStatus(record.status)}
      </p>,
    },
    {
      title: '命名空间',
      key: 'cronJob_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '调度',
      key: 'cronJob_scheduling',
      sorter: (a, b) => sorterFirstAlphabet(a.spec.schedule, b.spec.schedule),
      render: (_, record) => record.spec.schedule,
    },
    {
      title: '并发策略',
      key: 'concurrency_strategy',
      sorter: (a, b) => sorterFirstAlphabet(a.spec.concurrencyPolicy, b.spec.concurrencyPolicy),
      render: (_, record) => record.spec.concurrencyPolicy,
    },
    {
      title: '创建时间',
      key: 'cronJob_create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'handle',
      title: '操作',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Popover
            className='CronJobTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/cronJob/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteCronJob(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleCronJobOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取cronJobList
  const getCronJobsList = useCallback(async (isChange = true) => {
    setCronJobLoading(true);
    try {
      const res = await getCronJobsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchCronJob(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setCronJobList([]); // 数组为空
      }
    }
    setCronJobLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchCronJob = (totalData = originalList, isChange = true) => {
    const cronJobFormName = cronJobForm.getFieldValue('cronJob_name');
    let temporyList = totalData;
    if (cronJobFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(cronJobFormName.toLowerCase()));
    }
    setCronJobList([...temporyList]);
    isChange ? setCronJobPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    const statusKey = Object.keys(cronJobStatus);
    statusKey.map(item => {
      statusArr.push({ text: item, value: cronJobStatus[item] });
    });
    setFilterCronJobStatus([...statusArr]);
  }, []);

  const handleCronjobTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterCronJobValue(filter.cronJobStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterCronJobValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getCronJobsList();
  }, [getCronJobsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={cronJobForm}>
      <Form.Item name="cronJob_name" className="pod_search_input">
        <Input.Search placeholder="搜索负载名称" onSearch={(() => handleSearchCronJob())} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/cronJob/createCronJob`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleCronJobReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={cronJobLoading}
          columns={cronJobColumns}
          dataSource={cronJobList}
          onChange={handleCronjobTableChange}
          pagination={{
            className: 'page',
            current: cronJobPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setCronJobPage(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除CronJob"
      open={cronJobDelModalOpen}
      cancelFn={handleDelCronJobCancel}
      content={[
        '删除CronJob后将无法恢复，请谨慎操作。',
        `确定删除CronJob ${cronJobDelName} 吗？`,
      ]}
      isCheck={isCronJobDelCheck}
      showCheck={true}
      checkFn={handleCronJobTabCheckFn}
      confirmFn={handleDelCronJobConfirm} />
  </div>;
}