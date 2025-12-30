/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import {
  Button,
  Form,
  Space,
  Input,
  Table,
  ConfigProvider,
  Popover,
  message,
}
  from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode, workloadFilterOptions } from '@/common/constants';
import { getPodsData, deletePodContainer } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { firstAlphabetUp, getWorkloadStatusJudge, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function PodTab() {
  const themeStore = useStore('theme');
  const [podForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();
  const namespace = useContext(NamespaceContext);

  const [messageApi, contextHolder] = message.useMessage();
  const [podList, setPodList] = useState([]); // 数据集
  const [podLoading, setPodLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [podPage, setPodPage] = useState(DEFAULT_CURRENT_PAGE); // 页码
  const [filterPodStatus, setFilterPodStatus] = useState([]); // 赋值筛选项
  const [podDelModalOpen, setPodDelModalOpen] = useState(false); // 删除对话框展示
  const [podDelName, setPodDelName] = useState(''); // 删除的名称
  const [podDelNamespace, setPodDelNamespace] = useState(''); // 删除的命名空间
  const [isPodDelCheck, setIsPodDelCheck] = useState(false); // 是否选中

  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterPodValue, setFilterPodValue] = useState();

  // 刷新按钮
  const handlePodResetWorkload = () => {
    getPodsList(false);
  };

  // 删除按钮
  const handleDeletePodWorkload = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setPodDelModalOpen(true); // 打开弹窗
    setPodDelName(record.metadata.name);
    setPodDelNamespace(record.metadata.namespace);
    setIsPodDelCheck(false);
  };

  const handleDelPodCancelWorkload = () => {
    setPodDelModalOpen(false);
    setPodDelName('');
    setPodDelNamespace('');
  };

  const handleDelPodConfirmWorkload = async () => {
    try {
      const res = await deletePodContainer(podDelNamespace, podDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！请手动刷新');
        setIsPodDelCheck(false);
        setPodDelModalOpen(false);
        setPodDelName('');
        setPodDelNamespace('');
        getPodsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handlePodCheckFn = (e) => {
    setIsPodDelCheck(e.target.checked);
  };

  const handlePodOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  const sortPod = (a, b) => {
    let firstTime = a.metadata.annotations?.lastUpdateTime ? a.metadata.annotations.lastUpdateTime : a.metadata.creationTimestamp;
    let endTime = b.metadata.annotations?.lastUpdateTime ? b.metadata.annotations.lastUpdateTime : b.metadata.creationTimestamp;
    return Dayjs(firstTime) - Dayjs(endTime);
  };

  // 列表项
  const podColumns = [
    {
      title: 'Pod名称',
      key: 'pod_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/pod/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterPodStatus,
      width: 220,
      filterMultiple: false,
      filteredValue: filterPodValue ? [filterPodValue] : [],
      onFilter: (value, record) => record.status.phase.toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(a.status.phase, b.status.phase),
      key: 'podStatus',
      render: (_, record) => <p className={`resource_status ${(record.status.phase).toLowerCase()}_circle`}>
        {record.status.phase}
      </p>,
    },
    {
      title: '命名空间',
      key: 'pod_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '所属工作节点',
      key: 'pod_work_node',
      sorter: (a, b) => sorterFirstAlphabet(a.status.hostIP, b.status.hostIP),
      render: (_, record) => record.status.hostIP || '--',
    },
    {
      title: 'Pod IP地址',
      key: 'pod_ip',
      sorter: (a, b) => sorterFirstAlphabet(a.status.podIP, b.status.podIP),
      render: (_, record) => record.status.podIP || '--',
    },
    {
      title: '更新时间',
      key: 'pod_update_time',
      sorter: (a, b) => sortPod(a, b),
      render: (_, record) =>
        Dayjs(record.metadata.annotations?.lastUpdateTime ? record.metadata.annotations.lastUpdateTime : record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover
            className='podTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/pod/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeletePodWorkload(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handlePodOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取podList
  const getPodsList = useCallback(async (isChange = true) => {
    setPodLoading(true);
    try {
      const res = await getPodsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchPod(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setPodList([]); // 数组为空
      }
    }
    setPodLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchPod = (totalData = originalList, isChange = true) => {
    const podFormName = podForm.getFieldValue('pod_name');
    let temporyList = totalData;
    if (podFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(podFormName.toLowerCase()));
    }
    setPodList([...temporyList]);
    isChange ? setPodPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    workloadFilterOptions.map(item => {
      statusArr.push({ text: firstAlphabetUp(item), value: item });
    });
    setFilterPodStatus([...statusArr]);
  }, []);

  const handlePodTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterPodValue(filter.podStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterPodValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getPodsList();
  }, [getPodsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={podForm}>
      <Form.Item name="pod_name" className="pod_search_input">
        <Input.Search placeholder="搜索Pod名称" onSearch={() => handleSearchPod()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/pod/createPod`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handlePodResetWorkload} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={podLoading}
          columns={podColumns}
          dataSource={podList}
          onChange={handlePodTableChange}
          pagination={{
            className: 'page',
            current: podPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setPodPage(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除Pod"
      open={podDelModalOpen}
      cancelFn={handleDelPodCancelWorkload}
      content={[
        '删除Pod后将无法恢复，请谨慎操作。',
        `确定删除Pod ${podDelName} 吗？`,
      ]}
      isCheck={isPodDelCheck}
      showCheck={true}
      checkFn={handlePodCheckFn}
      confirmFn={handleDelPodConfirmWorkload} />
  </div>;
}