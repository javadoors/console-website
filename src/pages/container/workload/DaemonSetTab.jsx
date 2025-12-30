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
import { getDaemonSetsData, deleteDaemonSet } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { getDaemonSetStatus, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';

export default function DaemonSetTab() {
  const themeStore = useStore('theme');
  const [daemonSetForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();
  const namespace = useContext(NamespaceContext);

  const [daemonSetPage, setDaemonSetPage] = useState(DEFAULT_CURRENT_PAGE);
  const [messageApi, contextHolder] = message.useMessage();
  const [daemonSetList, setDaemonSetList] = useState([]); // 数据集
  const [daemonSetLoading, setDaemonSetLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [filterDaemonSetStatus, setFilterDaemonSetStatus] = useState([]); // 赋值筛选项

  const [daemonSetDelModalOpen, setDaemonSetDelModalOpen] = useState(false); // 删除对话框展示
  const [daemonSetDelName, setDaemonSetDelName] = useState(''); // 删除的名称
  const [daemonSetDelNamespace, setDaemonSetDelNamespace] = useState('');
  const [isDaemonSetDelCheck, setIsDaemonSetDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterDaemonSetValue, setFilterDaemonSetValue] = useState();

  // 重置按钮
  const handleDaemonSetReset = () => {
    getDaemonSetsList(false);
  };

  // 删除按钮
  const handleDeleteDaemonSet = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setDaemonSetDelModalOpen(true); // 打开弹窗
    setDaemonSetDelName(record.metadata.name);
    setDaemonSetDelNamespace(record.metadata.namespace);
    setIsDaemonSetDelCheck(false);
  };

  const handleDelDaemonSetCancel = () => {
    setDaemonSetDelModalOpen(false);
    setDaemonSetDelName('');
    setDaemonSetDelNamespace('');
  };

  const handleDelDaemonSetConfirm = async () => {
    try {
      const res = await deleteDaemonSet(daemonSetDelNamespace, daemonSetDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setDaemonSetDelModalOpen(false);
        setIsDaemonSetDelCheck(false);
        setDaemonSetDelName('');
        setDaemonSetDelNamespace('');
        getDaemonSetsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleDaemonSetTabCheckFn = (e) => {
    setIsDaemonSetDelCheck(e.target.checked);
  };

  const handleDaemonSetOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const daemonSetColumns = [
    {
      title: '负载名称',
      key: 'daemonSet_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/daemonSet/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterDaemonSetStatus,
      filterMultiple: false,
      filteredValue: filterDaemonSetValue ? [filterDaemonSetValue] : [],
      onFilter: (value, record) => getDaemonSetStatus(record.status).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(getDaemonSetStatus(a.status), getDaemonSetStatus(b.status)),
      key: 'daemonSetStatus',
      width: 220,
      render: (_, record) => <p className={`resource_status ${getDaemonSetStatus(record.status).toLowerCase()}_circle`}>
        {getDaemonSetStatus(record.status)}
      </p>,
    },
    {
      title: '命名空间',
      key: 'daemonSet_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '实例（正常/总量）',
      key: 'daemonSet_example',
      render: (_, record) => `${record.status.currentNumberScheduled}/${record.status.desiredNumberScheduled}`,
    },
    {
      title: '创建时间',
      key: 'daemonSet_create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'handle',
      fixed: 'right',
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Popover
            className='DaemonSetTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/daemonSet/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteDaemonSet(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleDaemonSetOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取daemonSetList
  const getDaemonSetsList = useCallback(async (isChange = true) => {
    setDaemonSetLoading(true);
    try {
      const res = await getDaemonSetsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchDaemonSet(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setDaemonSetList([]); // 数组为空
      }
    }
    setDaemonSetLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchDaemonSet = (totalData = originalList, isChange = true) => {
    const daemonSetFormName = daemonSetForm.getFieldValue('daemonSet_name');
    let temporyList = totalData;
    if (daemonSetFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(daemonSetFormName.toLowerCase()));
    }
    setDaemonSetList([...temporyList]);
    isChange ? setDaemonSetPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    const statusKey = Object.keys(deploymentStatus);
    statusKey.map(item => {
      statusArr.push({ text: item, value: deploymentStatus[item] });
    });
    setFilterDaemonSetStatus([...statusArr]);
  }, []);

  const handleDaemonSetTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterDaemonSetValue(filter.daemonSetStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterDaemonSetValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getDaemonSetsList();
  }, [getDaemonSetsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={daemonSetForm}>
      <Form.Item name="daemonSet_name" className="pod_search_input">
        <Input.Search placeholder="搜索负载名称" onSearch={() => handleSearchDaemonSet()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/daemonSet/createDaemonSet`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleDaemonSetReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={daemonSetLoading}
          columns={daemonSetColumns}
          dataSource={daemonSetList}
          onChange={handleDaemonSetTableChange}
          pagination={{
            className: 'page',
            current: daemonSetPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setDaemonSetPage(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除DaemonSet"
      open={daemonSetDelModalOpen}
      cancelFn={handleDelDaemonSetCancel}
      content={[
        '删除DaemonSet后将无法恢复，请谨慎操作。',
        `确定删除DaemonSet ${daemonSetDelName} 吗？`,
      ]}
      isCheck={isDaemonSetDelCheck}
      showCheck={true}
      checkFn={handleDaemonSetTabCheckFn}
      confirmFn={handleDelDaemonSetConfirm} />
  </div>;
}