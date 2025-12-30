/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message } from 'antd';
import { containerRouterPrefix } from '@/constant';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode, namespaceStatusOptions } from '@/common/constants';
import { getNamespaceList, deleteNamespace, getCPUAndMemUsageFromAllPods } from '@/api/containerApi';
import { Link, useHistory } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import { firstAlphabetUp, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import Big from 'big.js';


export default function NamespaceManagePage() {
  const [namespaceForm] = Form.useForm();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [namespacePage, setNamespacePage] = useState(DEFAULT_CURRENT_PAGE);
  const [namespaceListData, setNamespaceListData] = useState([]); // table
  const [namespaceLoading, setNamespaceLoading] = useState(false); // 加载中
  const themeStore = useStore('theme');
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [namespaceDelModalOpen, setNamespaceDelModalOpen] = useState(false); // 删除对话框展示
  const [namespaceDelName, setNamespaceDelName] = useState(''); // 删除的名称
  const [isNamespaceDelCheck, setIsNamespaceDelCheck] = useState(false); // 是否选中

  const [filterNamespaceStatus, setFilterNamespaceStatus] = useState([]); // 赋值筛选项
  const [originalList, setOriginalList] = useState([]); // 原始数据

  // 列表项
  const namespaceColumns = [
    {
      title: '命名空间名称',
      key: 'namespace_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/namespace/namespaceManage/detail/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      filters: filterNamespaceStatus,
      filterMultiple: false,
      key: 'namespace_status',
      onFilter: (value, record) => (record.status.phase).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(firstAlphabetUp(a.status.phase), firstAlphabetUp(b.status.phase)),
      width: 220,
      render: (_, record) => <div className={`status_group`}>
        <span className={record.status.phase === 'Active' ? 'running_circle' : 'terminating_circle'}></span>
        <span>{firstAlphabetUp(record.status.phase)}</span>
      </div>,
    },
    {
      title: '内存（MB）',
      key: 'namespace_memory',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.memoryUsage, b.metadata.memoryUsage),
      render: (_, record) => record.metadata.memoryUsage || '--',
    },
    {
      title: 'CPU（Core）',
      key: 'namespace_cpu',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.cpuUsage, b.metadata.cpuUsage),
      render: (_, record) => record.metadata.cpuUsage || '--',
    },
    {
      title: '创建时间',
      key: 'namespace_created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'namespace_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement='bottom' content={<div className='pop_modal'>
          <Button type='link'><Link to={`/${containerRouterPrefix}/namespace/namespaceManage/detail/${record.metadata.name}/yaml`}>修改</Link></Button>
          <Button type='link' onClick={() => handleDeleteNamespace(record)}>删除</Button></div>
        } trigger='click' open={popOpen === record.metadata.name} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.name) : setPopOpen('')}>
          <MoreOutlined className='common_antd_icon primary_color' />
        </Popover>
      </Space>,
    },
  ];

  // 根据命名空间获取对应的cpu/内存使用量
  const getNamespaceCpuAndMemoryData = useCallback(async () => {
    const namespaceUsage = {};
    try {
      const res = await getCPUAndMemUsageFromAllPods();
      if (res.status === ResponseCode.OK) {
        res.data.results.forEach(result => {
          const type = result.metricName;
          if (type === 'pod_cpu_usage') {
            result?.data?.result?.forEach(({ labels: { namespace }, sample: { value = 0 } = {} }) => {
              if (!namespaceUsage[namespace]) {
                namespaceUsage[namespace] = { cpuUsage: new Big(0), memoryUsage: new Big(0) };
              }
              namespaceUsage[namespace].cpuUsage = namespaceUsage[namespace].cpuUsage.plus(new Big(value));
            });
          } else if (type === 'pod_memory_usage') {
            result?.data?.result?.forEach(({ labels: { namespace }, sample: { value = 0 } = {} }) => {
              if (!namespaceUsage[namespace]) {
                namespaceUsage[namespace] = { cpuUsage: new Big(0), memoryUsage: new Big(0) };
              }
              namespaceUsage[namespace].memoryUsage = namespaceUsage[namespace].memoryUsage.plus(new Big(value));
            });
          } else {
          }
        });
        for (const usage of Object.values(namespaceUsage)) {
          let parseCpu = parseFloat(usage.cpuUsage.toFixed(2));
          let parseMem = parseFloat((usage.memoryUsage.div(1024 * 1024)).toFixed(2));
          if (usage.cpuUsage.eq(0)) {
            usage.cpuUsage = '0';
          } else if (parseCpu === 0) {
            usage.cpuUsage = '< 0.01';
          } else {
            usage.cpuUsage = parseCpu;
          }
          if (usage.memoryUsage.eq(0)) {
            usage.memoryUsage = '0';
          } else if (parseMem === 0) {
            usage.memoryUsage = '< 0.01';
          } else {
            usage.memoryUsage = parseMem;
          }
        }
      }
    } catch (e) {
      messageApi.error(`获取命名空间的内存&CPU失败!`);
      return namespaceUsage;
    }
    return namespaceUsage;
  }, []);

  const getNamespaceListData = useCallback(async (isChange = true) => {
    setNamespaceLoading(true);
    try {
      const res = await getNamespaceList();
      if (res.status === ResponseCode.OK) {
        const namespaceUsage = await getNamespaceCpuAndMemoryData();
        res.data.items.forEach(obj => {
          let namespace = obj.metadata.name;
          if (namespaceUsage[namespace]) {
            obj.metadata.cpuUsage = namespaceUsage[namespace].cpuUsage;
            obj.metadata.memoryUsage = namespaceUsage[namespace].memoryUsage;
          }
        });
        setOriginalList([...res.data.items]);
        handleSearchNamespace(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setNamespaceListData([]); // 数组为空
      }
    }
    setNamespaceLoading(false);
  }, []);

  // 重置按钮
  const handleNamespaceReset = () => {
    getNamespaceListData(false);
  };

  // 删除按钮
  const handleDeleteNamespace = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setNamespaceDelModalOpen(true); // 打开弹窗
    setNamespaceDelName(record.metadata.name);
    setIsNamespaceDelCheck(false);
  };

  const handleDelNamespaceCancel = () => {
    setNamespaceDelModalOpen(false);
    setNamespaceDelName('');
  };

  const handleDelNamespaceConfirm = async () => {
    try {
      const res = await deleteNamespace(namespaceDelName);
      if (res.status === ResponseCode.OK) {
        setNamespaceDelModalOpen(false);
        setNamespaceDelName('');
        setIsNamespaceDelCheck(false);
        messageApi.success('删除成功！请手动刷新');
        getNamespaceListData();
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
  const handleSearchNamespace = (totalData = originalList, isChange = true) => {
    const namespaceFormName = namespaceForm.getFieldValue('namespace_name');
    let temporyList = totalData;
    if (namespaceFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(namespaceFormName.toLowerCase()));
    }
    setNamespaceListData([...temporyList]);
    isChange ? setNamespacePage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleNamespaceCheckFn = (e) => {
    setIsNamespaceDelCheck(e.target.checked);
  };

  useEffect(() => {
    getNamespaceListData();
  }, [getNamespaceListData]);

  useEffect(() => {
    // 赋值
    let statusArr = [];
    Object.keys(namespaceStatusOptions).map(item => {
      statusArr.push({ text: namespaceStatusOptions[item], value: item });
    });
    setFilterNamespaceStatus([...statusArr]);
  }, []);

  return <div className='child_content'>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className='create_bread' items={[
      { title: '命名空间', path: `/${containerRouterPrefix}/namespace/namespaceManage`, disabled: true },
      { title: 'Namespace', path: `/` },
    ]} />
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={namespaceForm}>
        <Form.Item name="namespace_name" className="search_input">
          <Input.Search placeholder="搜索命名空间名称" onSearch={() => handleSearchNamespace()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className='primary_btn' onClick={() => history.push(`/${containerRouterPrefix}/namespace/namespaceManage/createNamespace`)}>创建</Button>
            <Button icon={<SyncOutlined />} onClick={handleNamespaceReset} className='reset_btn' style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className='tab_table_flex cluster_container_height'>
        <ConfigProvider locale={zhCN}>
          <Table
            className='table_padding'
            loading={namespaceLoading}
            columns={namespaceColumns}
            dataSource={namespaceListData}
            pagination={{
              className: 'page',
              current: namespacePage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setNamespacePage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title='删除命名空间'
        open={namespaceDelModalOpen}
        cancelFn={handleDelNamespaceCancel}
        content={[
          '删除命名空间后将无法恢复，同时会删除namespace下的所有pod、服务和其他资源，请谨慎操作。',
          `确定删除命名空间 ${namespaceDelName} 吗？`,
        ]}
        isCheck={isNamespaceDelCheck}
        showCheck={true}
        checkFn={handleNamespaceCheckFn}
        confirmFn={handleDelNamespaceConfirm} />
    </div>
  </div>;
}