/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import BreadCrumbCom from '@/components/BreadCrumbCom';
import { Button, Form, Space, Input, Table, Pagination, ConfigProvider, Popover, message, Tooltip } from 'antd';
import { SyncOutlined, MoreOutlined, CloseCircleFilled, CheckCircleFilled, LoadingOutlined, InfoCircleFilled, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, manageStatusFilterOptions } from '@/common/constants';
import { getHelmsData, getHelmHistoryVersionData, rollBackHelmVersion, deleteRelease } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ManagementBackRepoModal from '@/components/applicationManagement/ManagementBackRepoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { filterManageStateBack, filterManageState } from '@/utils/common';
import extendLogo from '@/assets/images/helmIcon.png';
import '@/styles/pages/extend.less';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import ToolTipComponent from '@/components/ToolTipComponent';
import { sorterFirstAlphabet } from '@/tools/utils';

export default function extendIndex() {
  const [extendForm] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState([]);
  const themeStore = useStore('theme');
  const nowNamespace = useContext(NamespaceContext);
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterExtendValue, setFilterExtendValue] = useState(); // 筛选值
  const [filterExtendStatus, setFilterExtendStatus] = useState([]); // 赋值筛选项

  const [messageApi, contextHolder] = message.useMessage();
  const [extendPage, setExtendPage] = useState(DEFAULT_CURRENT_PAGE);
  const [extendList, setExtendList] = useState([]); // 数据集
  const [extendLoading, setExtendLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [extendIndexUninstallModal, setExtendIndexUninstallModal] = useState(false); // 卸载的modal框
  const [extendIndexBackModal, setExtendIndexBackModal] = useState(false); // 回退的modal框 
  const [extendIndexUninstallName, setExtendIndexUninstallName] = useState('');
  const [extendIndexUninstallNamespace, setExtendIndexUninstallNamespace] = useState(''); // 删除的namespace
  const consolePluginStore = useStore('consolePlugins');

  // 回退部分
  const [extendIndexBackName, setExtendIndexBackName] = useState('');
  const [extendIndexBackAppVersion, setExtendIndexBackAppVersion] = useState('');
  const [extendIndexVersion, setExtendIndexVersion] = useState('');

  const [releaseHistoryList, setReleaseHistoryList] = useState([]);
  const [checkedExtendNameSpace, setCheckedExtendNameSpace] = useState('');
  const [checkedExtendName, setCheckedExtendName] = useState('');
  const [checkedExtendVersion, setCheckedExtendVersion] = useState(1);
  const [isUninstallDelCheck, setIsUninstallDelCheck] = useState(false); // 是否选中
  const [uninstallLoading, setUninstallLoding] = useState(false); // 卸载进度
  const [checkList, setCheckList] = useState({});
  const [uninstallStatusList, setUninstallStatusList] = useState({});
  const [onceClick, setOnceClick] = useState(false); // 卸载按钮禁止重复点击
  // 重置按钮
  const handleExtendReset = () => {
    getExtendsList(false);
  };

  // 升级按钮
  const handleUpLevelExtend = (record) => {
    history.push(`/${containerRouterPrefix}/extendManage/upLevel/${record.namespace}/${record.name}`);
  };

  // 卸载按钮
  const handleUninstallExtend = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setExtendIndexUninstallModal(true);
    setExtendIndexUninstallName(record.name);
    setExtendIndexUninstallNamespace(record.namespace);
  };

  // 整个项目刷新
  const refreshAllPage = () => {
    window.location.reload(); // 强制页面刷新
  };

  // 卸载model的确定按钮
  const handleExtendIndexConfirmUninstall = async () => {
    setOnceClick(true);
    let map = uninstallStatusList;
    try {
      setUninstallLoding(true);
      map[extendIndexUninstallName] = true;
      setUninstallStatusList({ ...map });
      const res = await deleteRelease(extendIndexUninstallNamespace, extendIndexUninstallName);
      if (res.status === ResponseCode.OK) {
        setUninstallLoding(false);
        map[extendIndexUninstallName] = false;
        setUninstallStatusList({ ...map });
        messageApi.open({
          duration: 10,
          content:
            <div className='extend_customize_message'>
              <CheckCircleFilled className='extend_customize_message_icon' />
              <p className='extend_customize_context' >扩展组件{extendIndexUninstallName}卸载成功</p>
              <p className='extend_customize_operate' onClick={refreshAllPage}>点击刷新</p>
            </div>,
        });
        setExtendIndexUninstallModal(false);
        getExtendsList();
        setOnceClick(false);
      }
    } catch (error) {
      setUninstallLoding(false);
      map[extendIndexUninstallName] = false;
      setUninstallStatusList({ ...map });
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
      setOnceClick(false);
    }
  };

  // 卸载model的取消按钮
  const extendIndexCancelModal = () => {
    let map = uninstallStatusList;
    if (map[extendIndexUninstallName]) {
      messageApi.loading('卸载中...');
    } else {
      setIsUninstallDelCheck(false);
      map[extendIndexUninstallName] = false;
      setUninstallStatusList({ ...map });
    }
    setExtendIndexUninstallModal(false);
  };

  const handleUninstallCheckFn = (e) => {
    setIsUninstallDelCheck(e.target.checked);
    let map = checkList;
    map[extendIndexUninstallName] = e.target.checked;
    setCheckList({ ...map });
  };

  // 回退按钮
  const handleBackVersionExtend = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setExtendIndexBackModal(true);
    setExtendIndexBackName(record.name);
    setExtendIndexBackAppVersion(record.chart.metadata.appVersion);
    setExtendIndexVersion(record.version);
    getExtendHistoryVersionList(record.namespace, record.name);
  };

  // 回退model的确定按钮
  const handleExtendIndexConfirmBack = async () => {
    try {
      const res = await rollBackHelmVersion(checkedExtendNameSpace, checkedExtendName, checkedExtendVersion);
      if (res.status === ResponseCode.OK) {
        messageApi.success('回退版本成功');
        setExtendIndexBackModal(false);
        getExtendsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('回退版本失败');
      }
      setExtendIndexBackModal(false);
    }
  };

  // 回退model的取消按钮
  const extendIndexBackCancelModal = () => {
    setExtendIndexBackModal(false);
  };

  // 回退数据获取extendHistoryVersionList
  const getExtendHistoryVersionList = useCallback(async (namespace, releaseName) => {
    try {
      const res = await getHelmHistoryVersionData(namespace, releaseName);
      if (res.status === ResponseCode.OK) {
        const arrExtend = res.data.data.map((item, index) => {
          return {
            ...item,
            key: index + 1,
          };
        });
        setReleaseHistoryList(arrExtend);
      }
    } catch (e) {
      setReleaseHistoryList([]);
    }
  }, []);

  // 回退选择
  const rowSelectionExtend = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setCheckedExtendNameSpace(selectedRows[0].namespace);
      setCheckedExtendVersion(selectedRows[0].version);
      setCheckedExtendName(selectedRows[0].name);
    },
    getCheckboxProps: (record) => ({
      name: record.version,
      disabled: extendIndexVersion === record.version,
    }),
  };

  // 状态图标判断
  const extendStateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className="extend_state_successful" />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className="extend_state_failed" />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className="extend_state_unknown" />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className="helm_state_unknown" />;
    } else {
      return <LoadingOutlined className="extend_state_pending" />;
    }
  };

  // 首页table列表项
  const extendColumns = [
    {
      title: '扩展组件名称',
      key: 'extend_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => <Space size="middle" className="">
        <div className="extend_name">
          {record.chart.metadata.icon ? <img src={record.chart.metadata.icon} alt="" style={{ height: '34px', width: '34px', marginRight: '8px' }} onError={(e) => e.target.src = extendLogo} />
            : <img src={extendLogo} alt="" style={{ height: '34px', width: '34px', marginRight: '8px' }} />}
          <Link to={`/${containerRouterPrefix}/extendManage/detail/${record.namespace}/${record.name}`}>{record.name}</Link>
        </div>
      </Space>,
    },
    {
      title: '状态',
      key: 'extendState',
      filters: filterExtendStatus,
      filteredValue: filterExtendValue ? [filterExtendValue] : [],
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(filterManageState(a.info.status), filterManageState(b.info.status)),
      onFilter: (value, record) => filterManageState(record.info.status).toLowerCase() === value.toLowerCase(),
      render: (_, record) => <Space size="middle" className="">
        <span> {extendStateIconFilter(filterManageState(record.info.status))}</span>
        <span className="extend_state_margin">{filterManageState(record.info.status)}</span>
      </Space>,
    },
    {
      title: '启动/停止界面',
      key: 'enablement',
      render: (_, record) => <Space size="middle" className="">
        <span>
          {consolePluginStore.$s.consolePlugins.filter(item => item.release === record.name && item.enabled).length}
          /
          {consolePluginStore.$s.consolePlugins.filter(item => item.release === record.name && !item.enabled).length}
        </span>
      </Space>,
    },
    {
      title: '更新时间',
      sorter: (a, b) => Dayjs(a.info.lastDeployed) - Dayjs(b.info.lastDeployed),
      key: 'extend_update_time',
      render: (_, record) => <Space size="middle" className="">
        {Dayjs(record.info.lastDeployed).format('YYYY-MM-DD HH:mm')}
      </Space>,
    },
    {
      title: '操作',
      key: 'extend_handle',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom" content={<div className="pop_modal">
            <Button type="link" onClick={() => handleUpLevelExtend(record)}> 升级</Button>
            <Button type="link" onClick={() => handleBackVersionExtend(record)}> 回退</Button>
            <Button type="link" onClick={() => handleUninstallExtend(record)}>卸载</Button></div>
          } trigger="click" open={popOpen === `${record.name}_${record.namespace}`} onOpenChange={newOpen => newOpen ? setPopOpen(`${record.name}_${record.namespace}`) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 回退table列表项
  const extendBackColumns = [
    {
      title: '应用模板',
      width: '20%',
      ellipsis: true,
      key: 'name',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendIndexClass'>
          <Tooltip placement="bottom" title={record.chartName}>
            <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      ellipsis: true,
      key: 'version',
      title: '序号',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendIndexClass'>
          <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.version}</p>
          {extendIndexVersion === record.version ? <div className="back_version_disable">
            <span className="back_version_disable_font">当前版本</span>
          </div> : ''}
        </Space>
      ),
    },
    {
      ellipsis: true,
      title: 'chart',
      key: 'chart',
      width: '25%',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendIndexClass'>
          <Tooltip placement="bottom" title={`${record.chartName}-${record.chartVersion}`}>
            <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}-{record.chartVersion}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      width: '25%',
      title: '更新时间',
      ellipsis: true,
      dataIndex: 'createTime',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendIndexClass'>
          <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{Dayjs(record.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
        </Space>
      ),
    },
  ];

  // 获取extendList
  const getExtendsList = useCallback(async (isChange = true) => {
    setExtendLoading(true);
    try {
      const res = await getHelmsData(true);
      if (res.status === ResponseCode.OK) {
        setOriginalList(res.data?.data?.items ? [...res.data.data.items] : []);
        handleSearchExtend(res.data.data.items, isChange);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setExtendList([]); // 数组为空
      }
    }
    setExtendLoading(false);
  }, [nowNamespace]);

  // 检索
  const handleSearchExtend = (totalData = originalList, isChange = true) => {
    const extendFormName = extendForm.getFieldValue('extend_name');
    let temporyList = totalData ? totalData : [];
    if (extendFormName) {
      temporyList = temporyList.filter(item => (item.name).toLowerCase().includes(extendFormName.toLowerCase()));
    }
    setExtendList([...temporyList]);
    isChange ? setExtendPage(DEFAULT_CURRENT_PAGE) : null;
  };

  // 表格变化
  const handleExtendTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterExtendValue(filter.extendState);
      }
    },
    []
  );

  useEffect(() => {
    getExtendsList();
  }, [getExtendsList]);

  useEffect(() => {
    if (location && location.state.status) {
      setFilterExtendValue([location.state.status.toLowerCase()]);
      window.history.replaceState(null, '');
    }
  }, [location]);

  useEffect(() => {
    let statusArr = [];
    manageStatusFilterOptions.map(item => {
      statusArr.push({ text: item, value: item });
    });
    setFilterExtendStatus([...statusArr]);
  }, []);
  return <div className='extend_all child_content withBread_content overview'>
    {contextHolder}
    <div className="extend-tab-top">
      <BreadCrumbCom className="create_bread" items={[{ title: '扩展组件管理', path: `/${containerRouterPrefix}/extendManage` }]} />
    </div>
    <ToolTipComponent>
      <span>扩展组件应用是通过自定义的前端提供扩展功能，您可以通过helm chart进行快速部署，并能便捷地进行升级、回退、启停前端界面和卸载等操作。</span>
    </ToolTipComponent>
    <div className="extend-tab-container" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <Form className="extend-searchForm form_padding_bottom" form={extendForm}>
        <Form.Item name="extend_name" className="extend-search-input">
          <Input.Search placeholder="搜索Extend名称" onSearch={() => handleSearchExtend()} autoComplete="off" maxLength={53} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleExtendReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={extendLoading}
            columns={extendColumns}
            dataSource={extendList}
            onChange={handleExtendTableChange}
            pagination={{
              className: 'page',
              current: extendPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: (page) => setExtendPage(page),
            }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="卸载扩展组件"
        open={extendIndexUninstallModal}
        cancelFn={extendIndexCancelModal}
        content={[
          '卸载后将无法恢复，请谨慎操作。',
          `确定卸载扩展组件 ${extendIndexUninstallName} 吗？`,
        ]}
        isCheck={checkList[extendIndexUninstallName]}
        showCheck={true}
        onceClick={onceClick}
        confirmText={'卸载'}
        confirmBtnStatus={uninstallStatusList[extendIndexUninstallName]}
        checkFn={handleUninstallCheckFn}
        confirmFn={handleExtendIndexConfirmUninstall} />
      <ManagementBackRepoModal
        name={extendIndexBackName}
        version={extendIndexBackAppVersion}
        open={extendIndexBackModal}
        cancelFn={extendIndexBackCancelModal}
        tableColumns={extendBackColumns}
        dataSource={releaseHistoryList}
        title="应用回退"
        rowSelection={rowSelectionExtend}
        confirmFn={handleExtendIndexConfirmBack}
      />
    </div>
  </div>;
}