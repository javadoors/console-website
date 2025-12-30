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
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode, workloadFilterOptions } from '@/common/constants';
import { getSecretList, deleteSecret } from '@/api/containerApi';
import { NamespaceContext } from '@/namespaceContext';
import { Breadcrumb, Tooltip } from 'antd';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import '@/styles/pages/workload.less';

export default function PodTab() {
  const [secretForm] = Form.useForm();
  const themeStore = useStore('theme');
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [secretPodList, setSecretPodList] = useState([]); // 数据集
  const [podLoading, setPodLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [filterPodStatus, setFilterPodStatus] = useState([]); // 赋值筛选项
  const [messageApi, contextHolder] = message.useMessage();
  const [secretDelModalOpen, setSecretDelModalOpen] = useState(false); // 删除对话框展示
  const [secretDelName, setSecretDelName] = useState(''); // 删除的名称
  const [secretDelNamespace, setSecretDelNamespace] = useState(''); // 删除的命名空间
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [isSecretDelCheck, setIsSecretDelCheck] = useState(false); // 是否选中
  const [secretKindFilters, setSecretKindFilters] = useState([]);

  // 重置按钮
  const handlePodResetSecretIndex = () => {
    getSecretsList();
  };

  // 删除按钮
  const handleDeleteLogSecretIndex = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setSecretDelModalOpen(true); // 打开弹窗
    setSecretDelName(record.metadata.name);
    setSecretDelNamespace(record.metadata.namespace);
    setIsSecretDelCheck(false);
  };
  // 取消删除
  const handleDelPodCancelSecretIndex = () => {
    setSecretDelModalOpen(false);
    setSecretDelName('');
    setSecretDelNamespace('');
  };

  const handleDelPodConfirm = async () => {
    try {
      const res = await deleteSecret(secretDelNamespace, secretDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setSecretDelModalOpen(false);
        setIsSecretDelCheck(false);
        setSecretDelNamespace('');
        setSecretDelName('');
        getSecretsList();
      }
    } catch (secretIndexError) {
      if (secretIndexError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, secretIndexError);
      } else {
        messageApi.error(`删除失败!${secretIndexError.response.data.message}`);
      }
    }
  };

  // 列表项
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 400,
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => (
        <Link
          to={`/${containerRouterPrefix}/configuration/secret/SecretDetail/${record.metadata.namespace}/${record.metadata.name}`}
        >
          <Tooltip title={record.metadata.name}>
            <div className='word_break'>{record.metadata.name}</div>
          </Tooltip>
        </Link>
      ),
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '种类',
      filters: secretKindFilters,
      onFilter: (value, record) => record.type === value,
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.type, b.type),
      dataIndex: 'type',
    },
    {
      title: '创建时间',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      dataIndex: 'creationTimestamp',
      render: (_, record) =>
        Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      dataIndex: '',
      key: 'x',
      render: (_, record) => (
        <Space className='defaultSecretClass'>
          <Popover
            placement='bottom'
            content={
              <div className='pop_modal defaultSecretClass'>
                <Button
                  type='text'
                  onClick={() =>
                    history.push(
                      `/${containerRouterPrefix}/configuration/secret/SecretUpdate/${record.metadata.namespace}/${record.metadata.name}/yaml`
                    )
                  }
                >
                  修改
                </Button>
                <Button type='link' onClick={() => handleDeleteLogSecretIndex(record)}>
                  删除
                </Button>
              </div>
            }
            trigger='click'
            open={popOpen === `${record.metadata.name}_${record.metadata.namespace}`}
            onOpenChange={(newOpen) =>
              newOpen ? setPopOpen(`${record.metadata.name}_${record.metadata.namespace}`) : setPopOpen('')
            }
          >
            <MoreOutlined className='common_antd_icon primary_color secret' />
          </Popover>
        </Space>
      ),
    },
  ];

  const handlePodCheckFn = (e) => {
    setIsSecretDelCheck(e.target.checked);
  };

  // 获取podList
  const getSecretsList = useCallback(async () => {
    setPodLoading(true);
    try {
      const resSecret = await getSecretList(namespace);
      if (resSecret.status === ResponseCode.OK) {
        setOriginalList([...resSecret.data.items]);
        // 
        let filterTempory = [];
        let finallyFilter = [];
        resSecret.data.items.map(item => {
          filterTempory.push(item.type);
        });
        [...new Set(filterTempory)].map(item => {
          finallyFilter.push({ text: item, value: item });
        });
        setSecretKindFilters(finallyFilter);
        if (secretForm.getFieldValue('secret_name')) {
          handleSearchConfigMap(resSecret.data.items); // secret 先搜索
        } else {
          setSecretPodList([...resSecret.data.items]);
        }
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setSecretPodList([]); // secret 数组为空
      }
    }
    setPodLoading(false);
  }, [namespace]);

  // secret 检索
  const handleSearchConfigMap = (totalData = originalList) => {
    const podFormName = secretForm.getFieldValue('secret_name');
    let temporyListSecret = [];
    if (podFormName) {
      temporyListSecret = totalData.filter(item => (item.metadata.name).toLowerCase().includes(podFormName.toLowerCase()));
    } else {
      temporyListSecret = totalData;
    }
    setSecretPodList([...temporyListSecret]);
  };

  useEffect(() => {
    // secret 赋值
    let statusArrSecret = [];
    workloadFilterOptions.map((item) => {
      statusArrSecret.push({ text: item, value: item });
    });
    setFilterPodStatus([...statusArrSecret]);
  }, []);

  useEffect(() => {
    getSecretsList();
  }, [getSecretsList]);

  return (
    <div className='configmap child_content withBread_content secret'>
      <BreadCrumbCom
        className='create_bread'
        items={[
          {
            title: '配置与密钥',
            path: `/${containerRouterPrefix}/configuration/secret`,
            disabled: true,
          },
          {
            title: 'Secret',
          },
        ]}
      />
      <div className='tab_container container_margin_box'>
        <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
          {contextHolder}
        </div>
        <Form className='pod_searchForm form_padding_bottom' form={secretForm}>
          <Form.Item name='secret_name' className='pod_search_input secret_search'>
            <Input.Search
              placeholder='搜索Secret名称'
              autoComplete='off'
              onSearch={() => handleSearchConfigMap()}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                className='primary_btn Secret'
                onClick={() => history.push(`/${containerRouterPrefix}/configuration/secret/CreateSecret`)}
              >
                创建
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={handlePodResetSecretIndex}
                className='reset_btn Secret'
                style={{ marginLeft: '16px' }}
              ></Button>
            </Space>
          </Form.Item>
        </Form>
        <div className='tab_table_flex Secret'>
          <ConfigProvider locale={zhCN}>
            <Table
              className='table_padding Secret'
              loading={podLoading}
              columns={columns}
              dataSource={secretPodList}
              pagination={{
                className: 'page',
                showQuickJumper: true,
                showTotal: (total) => `共${total}条`,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
              }}
              scroll={{ x: 1280 }}
            />
          </ConfigProvider>
        </div>
        <DeleteInfoModal
          title='删除Secret'
          open={secretDelModalOpen}
          cancelFn={handleDelPodCancelSecretIndex}
          content={[
            '删除Secret后将无法恢复，请谨慎操作。',
            `确定删除Secret ${secretDelName} 吗？`,
          ]}
          isCheck={isSecretDelCheck}
          showCheck={true}
          checkFn={handlePodCheckFn}
          confirmFn={handleDelPodConfirm}
        />
      </div>
    </div>
  );
}
