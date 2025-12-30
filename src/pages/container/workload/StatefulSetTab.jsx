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
import { getStatefulSetsData, deleteStatefulSet } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { getWorkloadStatusJudge, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';

export default function StatefulSetTab() {
  const themeStore = useStore('theme');
  const [statefulSetForm] = Form.useForm();
  const history = useHistory();
  const { state } = useLocation();
  const namespace = useContext(NamespaceContext);

  const [statefulSetPage, setStatefulSetPage] = useState(DEFAULT_CURRENT_PAGE);
  const [messageApi, contextHolder] = message.useMessage();
  const [statefulSetList, setStatefulSetList] = useState([]); // 数据集
  const [statefulSetLoading, setStatefulSetLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [filterStatefulSetStatus, setFilterStatefulSetStatus] = useState([]); // 赋值筛选项
  const [statefulSetDelModalOpen, setStatefulSetDelModalOpen] = useState(false); // 删除对话框展示
  const [statefulSetDelName, setStatefulSetDelName] = useState(''); // 删除的名称
  const [statefulSetDelNamespace, setStatefulSetDelNamespace] = useState('');
  const [isStatefulSetDelCheck, setIsStatefulSetDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterStatefulSetValue, setFilterStatefulSetValue] = useState();

  // 刷新按钮
  const handleStatefulSetReset = () => {
    getStatefulSetsList(false);
  };

  // 删除按钮
  const handleDeleteStatefulSet = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setStatefulSetDelModalOpen(true); // 打开弹窗
    setStatefulSetDelName(record.metadata.name);
    setStatefulSetDelNamespace(record.metadata.namespace);
    setIsStatefulSetDelCheck(false);
  };

  const handleDelStatefulSetCancel = () => {
    setStatefulSetDelModalOpen(false);
    setStatefulSetDelName('');
    setStatefulSetDelNamespace('');
  };

  const handleDelStatefulSetConfirm = async () => {
    try {
      const res = await deleteStatefulSet(statefulSetDelNamespace, statefulSetDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setStatefulSetDelModalOpen(false);
        setStatefulSetDelName('');
        setStatefulSetDelNamespace('');
        getStatefulSetsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleStatefulSetCheckFn = (e) => {
    setIsStatefulSetDelCheck(e.target.checked);
  };

  const handleStatefulSetOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const statefulSetColumns = [
    {
      title: '负载名称',
      key: 'statefulSet_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/statefulSet/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterStatefulSetStatus,
      filterMultiple: false,
      filteredValue: filterStatefulSetValue ? [filterStatefulSetValue] : [],
      onFilter: (value, record) => getWorkloadStatusJudge(record.status).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(getWorkloadStatusJudge(a.status), getWorkloadStatusJudge(b.status)),
      key: 'statefulSetStatus',
      render: (_, record) => <p className={`resource_status ${getWorkloadStatusJudge(record.status).toLowerCase()}_circle`}>
        {getWorkloadStatusJudge(record.status)}
      </p>,
    },
    {
      title: '命名空间',
      key: 'statefulSet_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      width: 220,
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '实例（正常/总量）',
      key: 'statefulSet_example',
      render: (_, record) => `${record.status.readyReplicas || 0}/${record.status.replicas}`,
    },
    {
      title: '创建时间',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      key: 'statefulSet_create_time',
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      fixed: 'right',
      width: 120,
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover
            className='StatefulSetTab'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/workload/statefulSet/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteStatefulSet(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleStatefulSetOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取statefulSetList
  const getStatefulSetsList = useCallback(async (isChange = true) => {
    setStatefulSetLoading(true);
    try {
      const res = await getStatefulSetsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchStatefulSet(res.data.items, isChange);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setStatefulSetList([]); // 数组为空
      }
    }
    setStatefulSetLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchStatefulSet = (totalData = originalList, isChange = true) => {
    const statefulSetFormName = statefulSetForm.getFieldValue('statefulSet_name');
    let temporyList = totalData;
    if (statefulSetFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(statefulSetFormName.toLowerCase()));
    }
    setStatefulSetList([...temporyList]);
    isChange ? setStatefulSetPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    // 赋值
    let statusArr = [];
    const statusKey = Object.keys(deploymentStatus);
    statusKey.map(item => {
      statusArr.push({ text: item, value: deploymentStatus[item] });
    });
    setFilterStatefulSetStatus([...statusArr]);
  }, []);

  const handleStatefulSetTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterStatefulSetValue(filter.statefulSetStatus);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterStatefulSetValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getStatefulSetsList();
  }, [getStatefulSetsList]);

  return <div className="tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="pod_searchForm form_padding_bottom" form={statefulSetForm}>
      <Form.Item name="statefulSet_name" className="pod_search_input">
        <Input.Search placeholder="搜索负载名称" onSearch={() => handleSearchStatefulSet()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/workload/statefulSet/createStatefulSet`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleStatefulSetReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={statefulSetLoading}
          columns={statefulSetColumns}
          dataSource={statefulSetList}
          onChange={handleStatefulSetTableChange}
          pagination={{
            className: 'page',
            current: statefulSetPage,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setStatefulSetPage(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除StatefulSet"
      open={statefulSetDelModalOpen}
      cancelFn={handleDelStatefulSetCancel}
      content={[
        '删除StatefulSet后将无法恢复，请谨慎操作。',
        `确定删除StatefulSet ${statefulSetDelName} 吗？`,
      ]}
      isCheck={isStatefulSetDelCheck}
      showCheck={true}
      checkFn={handleStatefulSetCheckFn}
      confirmFn={handleDelStatefulSetConfirm} />
  </div>;
}