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
  Pagination,
  ConfigProvider,
  Popover,
  message,
}
  from 'antd';
import { SyncOutlined, MoreOutlined, DownOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useRef, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, ResponseCode } from '@/common/constants';
import { getRolesData, deleteRole, getClusterRolesData, deleteClusterRole } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';

let roleBackList = [];
export default function RoleTab() {
  const themeStore = useStore('theme');
  const [roleForm] = Form.useForm();
  const roleFormRef = useRef(null);
  const history = useHistory();

  const namespace = useContext(NamespaceContext);
  const [rolePage, setRolePage] = useState(DEFAULT_CURRENT_PAGE);
  const [messageApi, contextHolder] = message.useMessage();
  const [roleList, setRoleList] = useState([]); // role数据集
  const [clusterRoleList, setClusterRoleList] = useState([]); // clusterRole数据集
  const [allRolesList, setAllRolesList] = useState([]); // role + clusterRole数据集
  const [roleLoading, setRoleLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  // roles
  const [roleDelModalOpen, setRoleDelModalOpen] = useState(false); // 删除对话框展示
  const [roleDelName, setRoleDelName] = useState(''); // 删除的名称
  const [roleDelNamespace, setRoleDelNamespace] = useState(''); // 删除的命名空间
  const [isRoleDelCheck, setIsRoleDelCheck] = useState(false); // 是否选中

  // clusterRoles
  const [clusterRoleDelModalOpen, setClusterRoleDelModalOpen] = useState(false); // 删除对话框展示
  const [clusterRoleDelName, setClusterRoleDelName] = useState(''); // 删除的名称
  const [clusterRoleDelNamespace, setClusterRoleDelNamespace] = useState(''); // 删除的命名空间
  const [isClusterRoleDelCheck, setIsClusterRoleDelCheck] = useState(false); // 是否选中

  const [roleSortObj, setRoleSortObj] = useState(''); // 排序
  const [roleFilterObj, setRoleFilterObj] = useState({}); // 筛选
  const [creatPopOpen, setCreatPopOpen] = useState(false); // 气泡悬浮

  // 重置按钮
  const handleRoleReset = useCallback(() => {
    getRolesList();
    getClusterRoleList();
  }, []);

  const handleRolePopOpenChange = (open) => {
    setCreatPopOpen(open);
  };

  // 删除按钮
  const handleDeleteRole = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    if (record.type === 'clusterRole') {
      setClusterRoleDelModalOpen(true); // 打开弹窗
      setClusterRoleDelName(record.metadata.name);
      setClusterRoleDelNamespace(record.metadata.namespace);
      setIsClusterRoleDelCheck(false);
    } else {
      setRoleDelModalOpen(true); // 打开弹窗
      setRoleDelName(record.metadata.name);
      setRoleDelNamespace(record.metadata.namespace);
      setIsRoleDelCheck(false);
    }
  };

  const handleDelRoleCancel = (type) => {
    if (type === 'clusterRole') {
      setClusterRoleDelModalOpen(false);
      setClusterRoleDelName('');
      setClusterRoleDelNamespace('');
    } else {
      setRoleDelModalOpen(false);
      setRoleDelName('');
      setRoleDelNamespace('');
    }
  };

  const handleDelRoleConfirm = async (type) => {
    if (type === 'clusterRole') {
      try {
        const res = await deleteClusterRole(clusterRoleDelName);
        if (res.status === ResponseCode.OK) {
          messageApi.success('删除成功！');
          setClusterRoleDelModalOpen(false);
          setIsClusterRoleDelCheck(false);
          setClusterRoleDelName('');
          setClusterRoleDelNamespace('');
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`删除失败!${error.response.data.message}`);
        }
      }
    } else {
      try {
        const res = await deleteRole(roleDelNamespace, roleDelName);
        if (res.status === ResponseCode.OK) {
          messageApi.success('删除成功！');
          setRoleDelModalOpen(false);
          setIsRoleDelCheck(false);
          setRoleDelName('');
          setRoleDelNamespace('');
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`删除失败!${error.response.data.message}`);
        }
      }
    }
    getRolesList();
    getClusterRoleList();
  };

  const handleRoleCheckFn = (e) => {
    setIsRoleDelCheck(e.target.checked);
  };

  const handleClusterRoleCheckFn = (e) => {
    setIsClusterRoleDelCheck(e.target.checked);
  };

  const handleRoleOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const roleColumns = [
    {
      title: '名称',
      key: 'role_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) =>
        <Link
          to={{
            pathname: `/${containerRouterPrefix}/userManage/role/detail`,
            state: {
              roleType: record.type === 'role' ? 'role' : 'clusterRole',
              roleNamespace: record.type === 'role' ? record.metadata.namespace : '',
              roleName: record.metadata.name,
            },
          }} >
          {record.metadata.name}
        </Link >,
    },
    {
      title: '类型',
      key: 'role_type',
      filters: [{ text: '角色', value: '角色' }, { text: '集群角色', value: '集群角色' }],
      onFilter: (value, record) => value === (record.type === 'role' ? '角色' : '集群角色'),
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.type === 'role' ? '角色' : '集群角色', b.type === 'role' ? '角色' : '集群角色'),
      render: (_, record) => record.type === 'role' ? '角色' : '集群角色',
    },
    {
      title: '命名空间',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      key: 'role_namespace',
      render: (_, record) => record.metadata.namespace ? record.metadata.namespace : '--',
    },
    {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom"
            content={
              <div className="pop_modal">
                <Link
                  to={{
                    pathname: `/${containerRouterPrefix}/userManage/role/detail/yaml`,
                    state: {
                      roleType: record.type === 'role' ? 'role' : 'clusterRole',
                      roleNamespace: record.type === 'role' ? record.metadata.namespace : '',
                      roleName: record.metadata.name,
                    },
                  }} className="primary_link">
                  修改
                </Link >
                <Button type="link" onClick={() => handleDeleteRole(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleRoleOpenChange(e, record)}
          >
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover >
        </Space >
      ),
    },
  ];

  // 获取roleList
  const getRolesList = useCallback(async () => {
    try {
      const res = await getRolesData(namespace, '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        let _roleList = [];
        res.data.items.forEach(item => {
          item.type = 'role';
          _roleList.push(item);
        });
        setRoleList([..._roleList]);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setRoleList([]); // 数组为空
      }
    }
  }, [namespace]);

  // 获取clusterRoleList
  const getClusterRoleList = useCallback(async () => {
    try {
      const res = await getClusterRolesData('', '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        let _clusterRoleList = [];
        res.data.items.forEach(item => {
          item.type = 'clusterRole';
          item.metadata.namespace = 'all';
          _clusterRoleList.push(item);
        });
        setClusterRoleList([..._clusterRoleList]);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setClusterRoleList([]); // 数组为空
      }
    }
  }, []);

  // roles数据集与clusterRoles数据集合并
  const getAllRolesList = useCallback(async () => {
    let flagChange = false;
    let allRoleList = [...clusterRoleList, ...roleList];
    if (allRoleList !== roleBackList) {
      flagChange = true;
    }
    roleBackList = allRoleList;
    let sortArr = [];
    sortArr = allRoleList.sort((a, b) => {
      let nameA = a.metadata.name;
      let nameB = b.metadata.name;
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    getAllRolesData(flagChange);
  }, [JSON.stringify(clusterRoleList), JSON.stringify(roleList)]);

  // table处理数据
  const getAllRolesData = (isChange = true) => {
    if (roleFormRef.current) {
      let filtertArr = [];
      if (roleForm.getFieldsValue().role_name) {
        filtertArr = roleBackList.filter(item => ((item.metadata.name).toLowerCase()).includes((roleForm.getFieldsValue().role_name).toLowerCase()));
      } else {
        filtertArr = JSON.parse(JSON.stringify(roleBackList));
      }
      setAllRolesList([...filtertArr]);
      isChange ? setRolePage(DEFAULT_CURRENT_PAGE) : null;
    }
  };

  useEffect(() => {
    getRolesList();
  }, [getRolesList]);

  useEffect(() => {
    getClusterRoleList();
  }, [getClusterRoleList]);

  useEffect(() => {
    getAllRolesList();
  }, [getAllRolesList]);

  useEffect(() => {
    getAllRolesData();
  }, [roleFilterObj, roleSortObj]);

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread"
      items={[{ title: 'RBAC管理', path: `/${containerRouterPrefix}/userManage/role`, disabled: true }, { title: '角色', path: '/' }]}
    />
    <div className="tab_container container_margin_box">
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <Form className="pod_searchForm form_padding_bottom" form={roleForm} ref={roleFormRef}>
        <Form.Item name="role_name" className="pod_search_input">
          <Input.Search placeholder="搜索角色名称" onSearch={() => getAllRolesData()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Popover placement='bottom'
              content={
                <Space className='column_pop'>
                  <Button type="link" onClick={() => history.push(`/${containerRouterPrefix}/userManage/role/createRole`)}>角色</Button>
                  <Button type="link" onClick={() => history.push(`/${containerRouterPrefix}/userManage/role/createClusterRole`)}>集群角色</Button>
                </Space>
              }
              open={creatPopOpen}
              onOpenChange={handleRolePopOpenChange}>
              <Button className="primary_btn">创建<DownOutlined className='small_margin_adjust' /></Button>
            </Popover>
            <Button icon={<SyncOutlined />} onClick={handleRoleReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={roleLoading}
            columns={roleColumns}
            dataSource={allRolesList}
            pagination={{
              className: 'page',
              current: rolePage,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: page => setRolePage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除角色"
        open={roleDelModalOpen}
        cancelFn={() => handleDelRoleCancel('role')}
        content={[
          '删除角色后将无法恢复，请谨慎操作。',
          `确定删除角色 ${roleDelName} 吗？`,
        ]}
        isCheck={isRoleDelCheck}
        showCheck={true}
        checkFn={handleRoleCheckFn}
        confirmFn={() => handleDelRoleConfirm('role')} />

      <DeleteInfoModal
        title="删除集群角色"
        open={clusterRoleDelModalOpen}
        cancelFn={() => handleDelRoleCancel('clusterRole')}
        content={[
          '删除集群角色后将无法恢复，请谨慎操作。',
          `确定删除集群角色 ${clusterRoleDelName} 吗？`,
        ]}
        isCheck={isClusterRoleDelCheck}
        showCheck={true}
        checkFn={handleClusterRoleCheckFn}
        confirmFn={() => handleDelRoleConfirm('clusterRole')} />
    </div>
  </div>;
}