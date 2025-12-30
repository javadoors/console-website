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
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { getServiceAccountsData, deleteServiceAccount } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import '@/styles/pages/workload.less';

export default function ServiceAccountTab() {
  const [serviceAccountForm] = Form.useForm();
  const themeStore = useStore('theme');
  const history = useHistory();

  const namespace = useContext(NamespaceContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [serviceAccountPage, setServiceAccountPage] = useState(DEFAULT_CURRENT_PAGE);
  const [serviceAccountList, setServiceAccountList] = useState([]); // 数据集
  const [serviceAccountLoading, setServiceAccountLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [serviceAccountDelModalOpen, setServiceAccountDelModalOpen] = useState(false); // 删除对话框展示
  const [serviceAccountDelName, setServiceAccountDelName] = useState(''); // 删除的名称
  const [serviceAccountDelNamespace, setServiceAccountDelNamespace] = useState(''); // 删除的命名空间
  const [isServiceAccountDelCheck, setIsServiceAccountDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据

  // 重置按钮
  const handleServiceAccountReset = () => {
    getServiceAccountsList(false);
  };

  // 删除按钮
  const handleDeleteServiceAccount = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setServiceAccountDelModalOpen(true); // 打开弹窗
    setServiceAccountDelName(record.metadata.name);
    setServiceAccountDelNamespace(record.metadata.namespace);
    setIsServiceAccountDelCheck(false);
  };

  const handleDelServiceAccountCancel = () => {
    setServiceAccountDelModalOpen(false);
    setServiceAccountDelName('');
    setServiceAccountDelNamespace('');
  };

  const handleDelServiceAccountConfirm = async () => {
    try {
      const res = await deleteServiceAccount(serviceAccountDelNamespace, serviceAccountDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setServiceAccountDelModalOpen(false);
        setIsServiceAccountDelCheck(false);
        setServiceAccountDelName('');
        setServiceAccountDelNamespace('');
        getServiceAccountsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleServiceAccountIndexCheckFn = (e) => {
    setIsServiceAccountDelCheck(e.target.checked);
  };

  const handleServiceAccountOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const serviceAccountColumns = [
    {
      title: '服务账号名称',
      key: 'serviceAccount_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/userManage/serviceAccount/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '命名空间',
      key: 'serviceAccount_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '创建时间',
      key: 'serviceAccount_created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) =>
        Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover
            className='serviceAccountIndex'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/userManage/serviceAccount/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteServiceAccount(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleServiceAccountOpenChange(e, record)}
          >
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover >
        </Space >
      ),
    },
  ];

  // 获取serviceAccountList
  const getServiceAccountsList = useCallback(async (isChange = true) => {
    setServiceAccountLoading(true);
    try {
      const res = await getServiceAccountsData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchServiceAccount(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setServiceAccountList([]); // 数组为空
      }
    }
    setServiceAccountLoading(false);
  }, [namespace]);

  // 检索
  const handleSearchServiceAccount = (totalData = originalList, isChange = true) => {
    const serviceAccountFormName = serviceAccountForm.getFieldValue('serviceAccount_name');
    let temporyList = totalData;
    if (serviceAccountFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(serviceAccountFormName.toLowerCase()));
    }
    setServiceAccountList([...temporyList]);
    isChange ? setServiceAccountPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    getServiceAccountsList();
  }, [getServiceAccountsList]);

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread"
      items={[{ title: 'RBAC管理', path: `/${containerRouterPrefix}/userManage/serviceAccount`, disabled: true }, { title: '服务账号', path: '/' }]}
    />
    <div className="tab_container container_margin_box">
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <Form className="pod_searchForm form_padding_bottom" form={serviceAccountForm}>
        <Form.Item name="serviceAccount_name" className="pod_search_input">
          <Input.Search placeholder="搜索服务账号名称" onSearch={() => handleSearchServiceAccount()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/userManage/serviceAccount/createServiceAccount`)}>创建</Button>
            <Button icon={<SyncOutlined />} onClick={handleServiceAccountReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={serviceAccountLoading}
            columns={serviceAccountColumns}
            dataSource={serviceAccountList}
            pagination={{
              className: 'page',
              current: serviceAccountPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setServiceAccountPage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除服务账号"
        open={serviceAccountDelModalOpen}
        cancelFn={handleDelServiceAccountCancel}
        content={[
          '删除服务账号后将无法恢复，请谨慎操作。',
          `确定删除服务账号 ${serviceAccountDelName} 吗？`,
        ]}
        isCheck={isServiceAccountDelCheck}
        showCheck={true}
        checkFn={handleServiceAccountIndexCheckFn}
        confirmFn={handleDelServiceAccountConfirm} />
    </div>
  </div>;
}