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
import { DEFAULT_CURRENT_PAGE, ResponseCode, jobStatus } from '@/common/constants';
import { getJobsData, deleteJob } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { getJobStatus, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function JobTab() {
  const themeStore = useStore('theme');
  const [jobForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();
  const namespace = useContext(NamespaceContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [jobPage, setJobPage] = useState(DEFAULT_CURRENT_PAGE);
  const [jobList, setJobList] = useState([]); // 数据集
  const [jobLoading, setJobLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [filterJobStatus, setFilterJobStatus] = useState([]); // 赋值筛选项

  const [jobDelModalOpen, setJobDelModalOpen] = useState(false); // 删除对话框展示
  const [jobDelName, setJobDelName] = useState(''); // 删除的名称
  const [jobDelNamespace, setJobDelNamespace] = useState('');
  const [isJobDelCheck, setIsJobDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterJobValue, setFilterJobValue] = useState();

  // 重置按钮
  const handleJobReset = () => {
    getJobsList(false);
  };

  // 删除按钮
  const handleDeleteJob = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setJobDelModalOpen(true); // 打开弹窗
    setJobDelName(record.metadata.name);
    setJobDelNamespace(record.metadata.namespace);
    setIsJobDelCheck(false);
  };

  const handleDelJobCancel = () => {
    setJobDelModalOpen(false);
    setJobDelName('');
    setJobDelNamespace('');
  };

  const handleDelJobConfirm = async () => {
    try {
      const res = await deleteJob(jobDelNamespace, jobDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setJobDelModalOpen(false);
        setIsJobDelCheck(false);
        setJobDelName('');
        setJobDelNamespace('');
        getJobsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleJobTabCheckFn = (e) => {
    setIsJobDelCheck(e.target.checked);
  };

  const handleJobOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const jobColumns = [
    {
      title: '负载名称',
      key: 'job_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/job/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterJobStatus,
      filterMultiple: false,
      filteredValue: filterJobValue ? [filterJobValue] : [],
      onFilter: (value, record) => getJobStatus(record.status).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(getJobStatus(a.status), getJobStatus(b.status)),
      width: 220,
      key: 'jobStatus',
      render: (_, record) => <p className={`resource_status ${getJobStatus(record.status).toLowerCase()}_circle`}>
        {getJobStatus(record.status)}
      </p>,
    },
    {
      title: '命名空间',
      key: 'job_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '实例（正常/总量）',
      key: 'job_example',
      render: (_, record) => `${record.status.succeeded || 0}/${(record.status.succeeded || 0 + record.status.ready || 0)}`,
    },
    {
      title: '执行时间',
      key: 'completionTime',
      sorter: (a, b) => Dayjs(a.status.completionTime) - Dayjs(b.status.completionTime),
      render: (_, record) => record.status.completionTime ? Dayjs(record.status.completionTime).format('YYYY-MM-DD HH:mm') : '--',
    },
    {
      title: '创建时间',
      key: 'job_create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      fixed: 'right',
      key: 'handle',
      width: 120,
      render: (_, record) => (
        <Space>
          <Popover
            className='JobTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/job/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteJob(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleJobOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取jobList
  const getJobsList = useCallback(async (isChange = true) => {
    setJobLoading(true);
    try {
      const res = await getJobsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchJob(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setJobList([]); // 数组为空
      }
    }
    setJobLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchJob = (totalData = originalList, isChange = true) => {
    const jobFormName = jobForm.getFieldValue('job_name');
    let temporyList = totalData;
    if (jobFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(jobFormName.toLowerCase()));
    }
    setJobList([...temporyList]);
    isChange ? setJobPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    const statusKey = Object.keys(jobStatus);
    statusKey.map(item => {
      statusArr.push({ text: item, value: jobStatus[item] });
    });
    setFilterJobStatus([...statusArr]);
  }, []);

  const handleJobTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterJobValue(filter.jobStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterJobValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getJobsList();
  }, [getJobsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={jobForm}>
      <Form.Item name="job_name" className="pod_search_input">
        <Input.Search placeholder="搜索负载名称" onSearch={() => handleSearchJob()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/job/createJob`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleJobReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={jobLoading}
          columns={jobColumns}
          dataSource={jobList}
          onChange={handleJobTableChange}
          pagination={{
            className: 'page',
            current: jobPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setJobPage(page),
          }}
          scroll={{ x: 1280 }} />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除Job"
      open={jobDelModalOpen}
      cancelFn={handleDelJobCancel}
      content={[
        '删除Job后将无法恢复，请谨慎操作。',
        `确定删除Job ${jobDelName} 吗？`,
      ]}
      isCheck={isJobDelCheck}
      showCheck={true}
      checkFn={handleJobTabCheckFn}
      confirmFn={handleDelJobConfirm} />
  </div>;
}