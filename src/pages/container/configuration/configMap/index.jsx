/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button, Form, Space, Input, Table, ConfigProvider, Popover, message } from 'antd';
import { ResponseCode, workloadFilterOptions } from '@/common/constants';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { getConfigMapsList, deleteConfigMaps } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import Dayjs from 'dayjs';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { Breadcrumb, Tooltip } from 'antd';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import '@/styles/pages/workload.less';

export default function PodTab() {
  const [configMapForm] = Form.useForm();
  const themeStore = useStore('theme');
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [configPodTotal, setConfigPodTotal] = useState(0);
  const [configPodList, setConfigPodList] = useState([]); // 数据集
  const [configMapDelNamespace, setConfigMapDelNamespace] = useState(''); // 删除的命名空间
  const [isConfigMapDelCheck, setIsConfigMapDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [podLoading, setPodLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [filterPodStatus, setFilterPodStatus] = useState([]); // 赋值筛选项
  const namespace = useContext(NamespaceContext);
  const [configMapDelModalOpen, setConfigMapDelModalOpen] = useState(false); // 删除对话框展示
  const [configMapDelName, setConfigMapDelName] = useState(''); // 删除的名称

  // 重置按钮
  const handlePodResetConfigMapIndex = () => {
    getConfigMapList();
  };

  // 删除按钮
  const handleDeleteLogConfigMapIndex = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setConfigMapDelModalOpen(true); // 打开弹窗
    setConfigMapDelName(record.metadata.name);
    setConfigMapDelNamespace(record.metadata.namespace);
    setIsConfigMapDelCheck(false);
  };
  // 取消删除
  const handleDelPodCancelConfigMapIndex = () => {
    setConfigMapDelModalOpen(false);
    setConfigMapDelNamespace('');
    setConfigMapDelName('');
  };

  const handleDelPodConfirm = async () => {
    try {
      const res = await deleteConfigMaps(configMapDelNamespace, configMapDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setConfigMapDelModalOpen(false);
        setIsConfigMapDelCheck(false);
        setConfigMapDelName('');
        setConfigMapDelNamespace('');
        getConfigMapList();
      }
    } catch (configMapIndexError) {
      if (configMapIndexError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, configMapIndexError);
      } else {
        messageApi.error(`删除失败!${configMapIndexError.response.data.message}`);
      }
    }
  };

  const handleConfigMapCheckFn = (e) => {
    setIsConfigMapDelCheck(e.target.checked);
  };

  // 列表项
  const columns = [
    {
      title: '名称',
      key: 'name',
      width: 400,
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => (
        <Link
          to={`/${containerRouterPrefix}/configuration/configMap/ConfigurationDetail/${record.metadata.namespace}/${record.metadata.name}`}
        >
          <Tooltip title={record.metadata.name}>
            <div className='word_break'>{record.metadata.name}</div>
          </Tooltip>
        </Link>
      ),
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '创建时间',
      key: 'creationTimestamp',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) =>
        Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      dataIndex: '',
      key: 'x',
      render: (_, record) => (
        <Space>
          <Popover
            placement='bottom'
            content={
              <div className='pop_modal'>
                <Button
                  type='text'
                  onClick={() =>
                    history.push(
                      `/${containerRouterPrefix}/configuration/configMap/ConfigurationUpdate/${record.metadata.namespace}/${record.metadata.name}/yaml`
                    )
                  }
                >
                  修改
                </Button>
                <Button onClick={() => handleDeleteLogConfigMapIndex(record)} type='text'>
                  删除
                </Button>
              </div>
            }
            trigger='click'
            open={
              popOpen === `${record.metadata.name}_${record.metadata.namespace}`
            }
            onOpenChange={(newOpen) =>
              newOpen
                ? setPopOpen(
                  `${record.metadata.name}_${record.metadata.namespace}`
                )
                : setPopOpen('')
            }
          >
            <MoreOutlined className='common_antd_icon primary_color configMap' />
          </Popover>
        </Space>
      ),
    },
  ];

  // configMap 获取podList
  const getConfigMapList = useCallback(async () => {
    setPodLoading(true);
    try {
      const resConfig = await getConfigMapsList(namespace);
      if (resConfig.status === ResponseCode.OK) {
        setOriginalList([...resConfig.data.items]);
        if (configMapForm.getFieldValue('configMap_name')) {
          handleSearchConfigMap(resConfig.data.items); // configMap 先搜索
        } else {
          setConfigPodList([...resConfig.data.items]);
          setConfigPodTotal(resConfig.data.items.length);
        }
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setConfigPodList([]); // configMap数组为空
        setConfigPodTotal(0);
      }
    }
    setPodLoading(false);
  }, [namespace]);

  // configMap 检索
  const handleSearchConfigMap = (totalData = originalList) => {
    const podFormName = configMapForm.getFieldValue('configMap_name');
    let temporyListconfigMap = [];
    if (podFormName) {
      temporyListconfigMap = totalData.filter(item => (item.metadata.name).toLowerCase().includes(podFormName.toLowerCase()));
    } else {
      temporyListconfigMap = totalData;
    }
    setConfigPodList([...temporyListconfigMap]);
    setConfigPodTotal(temporyListconfigMap.length);
  };

  useEffect(() => {
    // configMap 赋值
    let statusArrconfigMap = [];
    workloadFilterOptions.map((item) => {
      statusArrconfigMap.push({ text: item, value: item });
    });
    setFilterPodStatus([...statusArrconfigMap]);
  }, []);

  useEffect(() => {
    getConfigMapList();
  }, [getConfigMapList]);

  return (
    <div className='configmap child_content withBread_content configMap'>
      <BreadCrumbCom
        className='create_bread'
        style={{ padding: '16px 32px' }}
        items={[
          {
            title: ' 配置与密钥',
            path: `/${containerRouterPrefix}/configuration/configMap`,
            disabled: true,
          },
          {
            title: 'ConfigMap',
          },
        ]}
      />
      <div className='tab_container container_margin_box'>
        <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
          {contextHolder}
        </div>
        <Form className='pod_searchForm form_padding_bottom' form={configMapForm}>
          <Form.Item name='configMap_name' className='pod_search_input configMap_search'>
            <Input.Search
              placeholder='搜索ConfigMap名称'
              onSearch={() => handleSearchConfigMap()}
              autoComplete='off'
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                className='primary_btn ConfigMap'
                onClick={() => history.push(`/${containerRouterPrefix}/configuration/configMap/CreateConfiguration`)}
              >
                创建
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={handlePodResetConfigMapIndex}
                className='reset_btn ConfigMap'
                style={{ marginLeft: '16px' }}
              ></Button>
            </Space>
          </Form.Item>
        </Form>
        <div className='tab_table_flex ConfigMap'>
          <ConfigProvider locale={zhCN}>
            <Table
              className='table_padding ConfigMap'
              loading={podLoading}
              dataSource={configPodList}
              columns={columns}
              pagination={{
                className: 'page',
                showTotal: (total) => `共${total}条`,
                showSizeChanger: true,
                total: configPodTotal,
                pageSizeOptions: [10, 20, 50],
                showQuickJumper: true,
              }}
              scroll={{ x: 1280 }}
            />
          </ConfigProvider>
        </div>
        <DeleteInfoModal
          title='删除ConfigMap'
          open={configMapDelModalOpen}
          cancelFn={handleDelPodCancelConfigMapIndex}
          content={[
            '删除ConfigMap后将无法恢复，请谨慎操作。',
            `确定删除ConfigMap ${configMapDelName} 吗？`,
          ]}
          isCheck={isConfigMapDelCheck}
          confirmFn={handleDelPodConfirm}
          showCheck={true}
          checkFn={handleConfigMapCheckFn}
        />
      </div>
    </div>
  );
}
