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
import { useCallback, useEffect, useState, useContext, useLayoutEffect, useRef, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, ResponseCode } from '@/common/constants';
import { getRoleBindsData, deleteRoleBind, getClusterRoleBindingsData, deleteClusterRoleBinding } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';

let roleBindBackList = [];
export default function RoleBindTab() {
  const [roleBindForm] = Form.useForm();
  const themeStore = useStore('theme');
  const roleBindFormRef = useRef(null);
  const history = useHistory();

  const namespace = useContext(NamespaceContext);

  const [messageApi, contextHolder] = message.useMessage();
  const [roleBindPage, setRoleBindPage] = useState(DEFAULT_CURRENT_PAGE);
  const [roleBindList, setRoleBindList] = useState([]); // roleBind数据集
  const [clusterRoleBindList, setClusterRoleBindList] = useState([]); // clusterRoleBinding数据集
  const [allRoleBindsList, setAllRoleBindsList] = useState([]); // roleBinding + clusterRoleBinding数据集
  const [roleBindLoading, setRoleBindLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  // roleBinding
  const [roleBindDelModalOpen, setRoleBindDelModalOpen] = useState(false); // 删除对话框展示
  const [roleBindDelName, setRoleBindDelName] = useState(''); // 删除的名称
  const [roleBindDelNamespace, setRoleBindDelNamespace] = useState(''); // 删除的命名空间
  const [isRoleBindDelCheck, setIsRoleBindDelCheck] = useState(false); // 是否选中

  // clusterRoleBinding
  const [clusterRoleBindDelModalOpen, setClusterRoleBindDelModalOpen] = useState(false); // 删除对话框展示
  const [clusterRoleBindDelName, setClusterRoleBindDelName] = useState(''); // 删除的名称
  const [clusterRoleBindDelNamespace, setClusterRoleBindDelNamespace] = useState(''); // 删除的命名空间
  const [isClusterRoleBindDelCheck, setIsClusterRoleBindDelCheck] = useState(false); // 是否选中

  const [roleBindSortObj, setRoleBindSortObj] = useState(''); // 排序
  const [roleBindFilterObj, setRoleBindFilterObj] = useState({}); // 筛选
  const [createPopOpen, setCreatePopOpen] = useState(false); // 气泡悬浮

  const [roleFilterList, setRoleFilterList] = useState([]); // 筛选角色
  const [themeKindFilterList, setThemeKindFilterList] = useState([]);

  const handleRoleBindReset = useCallback(() => {
    getRoleBindsList();
    getClusterRoleBindsList();
  }, []);

  const handleRoleBindPopOpenChange = (open) => {
    setCreatePopOpen(open);
  };

  // 删除按钮
  const handleDeleteRoleBind = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    if (record.type === 'clusterRoleBinding') {
      setClusterRoleBindDelModalOpen(true); // 打开弹窗
      setClusterRoleBindDelName(record.metadata.name);
      setClusterRoleBindDelNamespace(record.metadata.namespace);
      setIsClusterRoleBindDelCheck(false);
    } else {
      setRoleBindDelModalOpen(true); // 打开弹窗
      setRoleBindDelName(record.metadata.name);
      setRoleBindDelNamespace(record.metadata.namespace);
      setIsRoleBindDelCheck(false);
    }
  };

  const handleDelRoleBindCancel = (type) => {
    if (type === 'clusterRoleBinding') {
      setClusterRoleBindDelModalOpen(false);
      setClusterRoleBindDelName('');
      setClusterRoleBindDelNamespace('');
    } else {
      setRoleBindDelModalOpen(false);
      setRoleBindDelName('');
      setRoleBindDelNamespace('');
    }
  };

  const handleDelRoleBindConfirm = async (type) => {
    if (type === 'clusterRoleBinding') {
      try {
        const res = await deleteClusterRoleBinding(clusterRoleBindDelName);
        if (res.status === ResponseCode.OK) {
          messageApi.success('删除成功！');
          setClusterRoleBindDelModalOpen(false);
          setIsClusterRoleBindDelCheck(false);
          setClusterRoleBindDelName('');
          setClusterRoleBindDelNamespace('');
          getClusterRoleBindsList();
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
        const res = await deleteRoleBind(roleBindDelNamespace, roleBindDelName);
        if (res.status === ResponseCode.OK) {
          messageApi.success('删除成功！');
          setRoleBindDelModalOpen(false);
          setIsRoleBindDelCheck(false);
          setRoleBindDelName('');
          setRoleBindDelNamespace('');
          getRoleBindsList();
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`删除失败!${error.response.data.message}`);
        }
      }
    }
    getAllRoleBindsData();
  };

  const handleRoleBindCheckFn = (e) => {
    setIsRoleBindDelCheck(e.target.checked);
  };

  const handleClusterRoleBindCheckFn = (e) => {
    setIsClusterRoleBindDelCheck(e.target.checked);
  };

  // 列表项
  const roleBindColumns = [
    {
      title: '绑定名称',
      key: 'roleBind_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/userManage/${record.type === 'roleBinding' ? 'roleBinding' : 'clusterRoleBinding'}/detail/${record.type === 'roleBinding' && record.metadata.namespace ? `${record.metadata.namespace}/` : ''}${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '绑定类型',
      key: 'roleBind_type',
      filters: [{ text: '角色绑定', value: '角色绑定' }, { text: '集群角色绑定', value: '集群角色绑定' }],
      onFilter: (value, record) => value === (record.type === 'roleBinding' ? '角色绑定' : '集群角色绑定'),
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.type === 'roleBinding' ? '角色绑定' : '集群角色绑定', b.type === 'roleBinding' ? '角色绑定' : '集群角色绑定'),
      render: (_, record) => record.type === 'roleBinding' ? '角色绑定' : '集群角色绑定',
    },
    {
      title: '角色',
      filters: roleFilterList,
      onFilter: (value, record) => record.roleRef.name === value,
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.roleRef.name, b.roleRef.name),
      key: 'role_name',
      render: (_, record) => record.roleRef.name,
    },
    {
      title: '角色类型',
      filters: [{ text: '角色', value: '角色' }, { text: '集群角色', value: '集群角色' }],
      onFilter: (value, record) => value === (record.roleRef.kind === 'Role' ? '角色' : '集群角色'),
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.roleRef.kind === 'Role' ? '角色' : '集群角色', b.roleRef.kind === 'Role' ? '角色' : '集群角色'),
      key: 'role_type',
      render: (_, record) => record.roleRef.kind === 'Role' ? '角色' : '集群角色',
    },
    {
      title: '主题种类',
      key: 'roleBind_theme_kind',
      sorter: (a, b) => sorterFirstAlphabet(a.subjects ? a.subjects[0].kind : '--', b.subjects ? b.subjects[0].kind : '--'),
      render: (_, record) => record.subjects ? record.subjects[0].kind : '--',
    },
    {
      title: '主题名称',
      ellipsis: true,
      filters: themeKindFilterList,
      onFilter: (value, record) => (record.subjects ? record.subjects[0].name : '') === value,
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.subjects ? a.subjects[0].name : '--', b.subjects ? b.subjects[0].name : '--'),
      key: 'roleBind_theme_title',
      render: (_, record) => record.subjects ? record.subjects[0].name : '--',
    },
    {
      title: '命名空间',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      key: 'roleBind_namespace',
      render: (_, record) => record.metadata.namespace ? record.metadata.namespace : '--',
    },
    {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover
            className='roleBindingIndex'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={`/${containerRouterPrefix}/userManage/${record.type === 'roleBinding' ? 'roleBinding' : 'clusterRoleBinding'}/detail/${record.type === 'roleBinding' ? `${record.metadata.namespace}/` : ''}${record.metadata.name}/yaml`}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteRoleBind(record)}>删除</Button>
              </div>
            } trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handleRoleBindOpenChange(e, record)}
          >
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover >
        </Space >
      ),
    },
  ];

  // 获取roleBindList
  const getRoleBindsList = useCallback(async () => {
    try {
      const res = await getRoleBindsData(namespace, '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        let _roleList = [];
        res.data.items.forEach(item => {
          item.type = 'roleBinding';
          _roleList.push(item);
        });
        setRoleBindList([..._roleList]);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setRoleBindList([]); // 数组为空
      }
    }
  }, [namespace]);

  // 获取clusterRoleBindList
  const getClusterRoleBindsList = useCallback(async () => {
    try {
      const res = await getClusterRoleBindingsData('', '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        let _clusterRoleList = [];
        res.data.items.forEach(item => {
          item.type = 'clusterRoleBinding';
          item.metadata.namespace = 'all';
          _clusterRoleList.push(item);
        });
        setClusterRoleBindList([..._clusterRoleList]);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setClusterRoleBindList([]); // 数组为空
      }
    }
  }, []);

  // roleBinds数据集与clusterRoleBinds数据集合并
  const getAllRoleBindsList = useCallback(async () => {
    let flagChange = false;
    let allRoleList = [...clusterRoleBindList, ...roleBindList];

    // 获取所有role
    let roleFiltersList = [];
    let themeFiltersList = [];
    let finallyRoleList = [];
    let finallyThemeList = [];
    allRoleList.map(item => {
      roleFiltersList.push(item.roleRef.name);
      themeFiltersList.push(item.subjects ? item.subjects[0].name : '');
    });
    roleFiltersList = [...new Set(roleFiltersList)];
    themeFiltersList = [...new Set(themeFiltersList)];
    roleFiltersList.map(item => {
      finallyRoleList.push({ text: item, value: item });
    });
    themeFiltersList.map(item => {
      finallyThemeList.push({ text: item, value: item });
    });
    setRoleFilterList([...finallyRoleList]);
    setThemeKindFilterList([...finallyThemeList]);
    if (allRoleList !== roleBindBackList) {
      flagChange = true;
    }
    roleBindBackList = allRoleList;
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
    getAllRoleBindsData(flagChange);
  }, [JSON.stringify(clusterRoleBindList), JSON.stringify(roleBindList)]);

  // table处理数据
  const getAllRoleBindsData = (isChange = true) => {
    if (roleBindFormRef.current) {
      let filtertArr = [];
      if (roleBindForm.getFieldsValue().roleBind_name) {
        filtertArr = roleBindBackList.filter(item =>
          ((item.metadata.name).toLowerCase()).includes((roleBindForm.getFieldsValue().roleBind_name).toLowerCase())
        );
      } else {
        filtertArr = JSON.parse(JSON.stringify(roleBindBackList));
      }
      setAllRoleBindsList([...filtertArr]);
      isChange ? setRoleBindPage(DEFAULT_CURRENT_PAGE) : null;
    }
  };

  const handleRoleBindOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  useEffect(() => {
    getRoleBindsList();
  }, [getRoleBindsList]);

  useEffect(() => {
    getClusterRoleBindsList();
  }, [getClusterRoleBindsList]);

  useEffect(() => {
    getAllRoleBindsList();
  }, [getAllRoleBindsList]);

  useEffect(() => {
    getAllRoleBindsData();
  }, [roleBindFilterObj, roleBindSortObj]);

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread"
      items={[{ title: 'RBAC管理', path: `/${containerRouterPrefix}/userManage/roleBinding`, disabled: true }, { title: '角色绑定', path: '/' }]}
    />
    <div className="tab_container container_margin_box">
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <Form className="pod_searchForm form_padding_bottom" form={roleBindForm} ref={roleBindFormRef}>
        <Form.Item name="roleBind_name" className="pod_search_input">
          <Input.Search placeholder="搜索角色绑定名称" onSearch={() => getAllRoleBindsData()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Popover placement='bottom'
              content={
                <Space className='column_pop'>
                  <Button type="link" onClick={() => history.push(`/${containerRouterPrefix}/userManage/roleBinding/createRoleBind`)}>角色绑定</Button>
                  <Button type="link" onClick={() => history.push(`/${containerRouterPrefix}/userManage/roleBinding/createClusterRoleBind`)}>集群角色绑定</Button>
                </Space>
              }
              open={createPopOpen}
              onOpenChange={handleRoleBindPopOpenChange}>
              <Button className="primary_btn">创建<DownOutlined className='small_margin_adjust' /></Button>
            </Popover>
            <Button icon={<SyncOutlined />} onClick={handleRoleBindReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={roleBindLoading}
            columns={roleBindColumns}
            dataSource={allRoleBindsList}
            pagination={{
              className: 'page',
              current: roleBindPage,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: page => setRoleBindPage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除角色绑定"
        open={roleBindDelModalOpen}
        cancelFn={() => handleDelRoleBindCancel('roleBinding')}
        content={[
          '删除角色绑定后将无法恢复，请谨慎操作。',
          `确定删除角色绑定 ${roleBindDelName} 吗？`,
        ]}
        isCheck={isRoleBindDelCheck}
        showCheck={true}
        checkFn={handleRoleBindCheckFn}
        confirmFn={() => handleDelRoleBindConfirm('roleBinding')} />

      <DeleteInfoModal
        title="删除集群角色绑定"
        open={clusterRoleBindDelModalOpen}
        cancelFn={() => handleDelRoleBindCancel('clusterRoleBinding')}
        content={[
          '删除集群角色绑定后将无法恢复，请谨慎操作。',
          `确定删除集群角色绑定 ${clusterRoleBindDelName} 吗？`,
        ]}
        isCheck={isClusterRoleBindDelCheck}
        showCheck={true}
        checkFn={handleClusterRoleBindCheckFn}
        confirmFn={() => handleDelRoleBindConfirm('clusterRoleBinding')} />
    </div>
  </div>;
}