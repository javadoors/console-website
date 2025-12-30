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
import { SyncOutlined, MoreOutlined, CloseCircleFilled, CheckCircleFilled, LoadingOutlined, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { useCallback, useStore, useEffect, useState, useContext } from 'openinula';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, manageStatusFilterOptions } from '@/common/constants';
import { getHelmsData, getHelmHistoryVersionData, rollBackHelmVersion, deleteRelease } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ManagementBackRepoModal from '@/components/applicationManagement/ManagementBackRepoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { filterHelmType, filterManageState, filterManageStateBack } from '@/utils/common';
import helmIcon from '@/assets/images/helmIcon.png';
import '@/styles/pages/helm.less';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import ToolTipComponent from '@/components/ToolTipComponent';
import { sorterFirstAlphabet } from '@/tools/utils';

export default function helmIndex() {
  const [helmForm] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const nowNamespace = useContext(NamespaceContext);
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterHelmValue, setFilterHelmValue] = useState(); // 筛选值
  const [filterHelmStatus, setFilterHelmStatus] = useState([]); // 赋值筛选项

  const [messageApi, contextHolder] = message.useMessage();
  const [helmPage, setHelmPage] = useState(DEFAULT_CURRENT_PAGE);
  const [helmList, setHelmList] = useState([]); // 数据集
  const [helmLoading, setHelmLoading] = useState(false);
  const [popOpen, setPopOpen] = useState('');
  const [helmIndexUninstallModal, setHelmIndexUninstallModal] = useState(false);
  const [helmIndexBackModal, setHelmIndexBackModal] = useState(false);
  const [helmIndexUninstallName, setHelmIndexUninstallName] = useState(''); // 删除的name
  const [helmIndexUninstallNamespace, setHelmIndexUninstallNamespace] = useState(''); // 删除的namespace
  // 回退部分
  const [helmIndexBackName, setHelmIndexBackName] = useState('');
  const [helmIndexBackAppVersion, setHelmIndexBackAppVersion] = useState('');
  const [helmIndexVersion, setHelmIndexVersion] = useState('');
  const [releaseHistoryList, setReleaseHistoryList] = useState([]);
  const [checkedNameSpace, setCheckedNameSpace] = useState('');
  const [checkedName, setCheckedName] = useState('');
  const [checkedVersion, setCheckedVersion] = useState(1);
  const [isUninstallDelCheck, setIsUninstallDelCheck] = useState(false); // 是否选中
  const [onceClick, setOnceClick] = useState(false); // 卸载按钮禁止重复点击

  const themeStore = useStore('theme');

  // 重置按钮
  const handleHelmReset = () => {
    getHelmsList(false);
  };

  // 升级按钮
  const handleUpLevelHelm = (record) => {
    history.push(`/${containerRouterPrefix}/applicationManageHelm/upLevel/${record.namespace}/${record.name}`);
  };

  // 卸载按钮
  const handleUninstallHelm = (record) => {
    setPopOpen('');
    setHelmIndexUninstallModal(true);
    setHelmIndexUninstallName(record.name);
    setHelmIndexUninstallNamespace(record.namespace);
  };

  // 卸载model的确定按钮
  const handleHelmIndexConfirmUninstall = async () => {
    setOnceClick(true);
    try {
      const res = await deleteRelease(helmIndexUninstallNamespace, helmIndexUninstallName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('卸载成功');
        setHelmIndexUninstallModal(false);
        setIsUninstallDelCheck(false);
        getHelmsList();
        setOnceClick(false);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
      setOnceClick(false);
    }
  };

  // 卸载model的取消按钮
  const helmIndexCancelModal = () => {
    setHelmIndexUninstallModal(false);
    setIsUninstallDelCheck(false);
  };

  // 是否卸载
  const handleUninstallCheckFn = (e) => {
    setIsUninstallDelCheck(e.target.checked);
  };

  // 回退按钮
  const handleBackVersionHelm = (record) => {
    setPopOpen('');
    setHelmIndexBackModal(true);
    setHelmIndexBackName(record.name);
    setHelmIndexBackAppVersion(record.chart.metadata.appVersion);
    setHelmIndexVersion(record.version);
    getHelmHistoryVersionList(record.namespace, record.name);
  };

  // 回退model的确定按钮
  const handleHelmIndexConfirmBack = async () => {
    try {
      const res = await rollBackHelmVersion(checkedNameSpace, checkedName, checkedVersion);
      if (res.status === ResponseCode.OK) {
        messageApi.success('回退版本成功');
        setHelmIndexBackModal(false);
        getHelmsList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('回退版本失败');
      }
      setHelmIndexBackModal(false);
    }
  };

  // 回退model的取消按钮
  const helmIndexBackCancelModal = () => {
    setHelmIndexBackModal(false);
  };

  // 回退数据获取helmHistoryVersionList
  const getHelmHistoryVersionList = useCallback(async (namespace, releaseName) => {
    try {
      const res = await getHelmHistoryVersionData(namespace, releaseName);
      if (res.status === ResponseCode.OK) {
        const arrList = res.data.data.map((item, index) => {
          return {
            ...item,
            key: index + 1,
          };
        });
        setReleaseHistoryList(arrList);
      }
    } catch (e) {
      setReleaseHistoryList([]);
    }
  }, []);

  // 回退选择
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setCheckedNameSpace(selectedRows[0].namespace);
      setCheckedVersion(selectedRows[0].version);
      setCheckedName(selectedRows[0].name);
    },
    getCheckboxProps: (record) => ({
      name: record.version,
      disabled: helmIndexVersion === record.version,
    }),
  };

  // 状态图标判断
  const helmStateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className="helm_state_successful" />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className="helm_state_failed" />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className="helm_state_unknown" />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className="helm_state_unknown" />;
    } else {
      return <LoadingOutlined className="helm_state_pending" />;
    }
  };
  // 首页table列表项
  const helmColumns = [
    {
      title: '应用名称',
      key: 'helm_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => <Space size="middle" className="">
        <div className="helm_name">
          {record.chart.metadata.icon ? <img src={record.chart.metadata.icon} alt="" style={{ height: '34px', width: '34px', marginRight: '8px' }} onError={(e) => e.target.src = helmIcon} />
            : <img src={helmIcon} alt="" style={{ height: '34px', width: '34px', marginRight: '8px' }} />}
          <Link to={`/${containerRouterPrefix}/applicationManageHelm/detail/${record.namespace}/${record.name}`}>{record.name}</Link>
        </div>
      </Space>,
    },
    {
      title: '状态',
      key: 'helmState',
      filters: filterHelmStatus,
      filteredValue: filterHelmValue ? [filterHelmValue] : [],
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(filterManageState(a.info.status), filterManageState(b.info.status)),
      onFilter: (value, record) => filterManageState(record.info.status).toLowerCase() === value.toLowerCase(),
      render: (_, record) => <Space size="middle" className="">
        <span> {helmStateIconFilter(filterManageState(record.info.status))}</span>
        <span className="helm_state_margin">{filterManageState(record.info.status)}</span>
      </Space>,
    },
    {
      title: '更新时间',
      key: 'update_time',
      sorter: (a, b) => Dayjs(a.info.lastDeployed) - Dayjs(b.info.lastDeployed),
      render: (_, record) => <Space size="middle" className="">
        {Dayjs(record.info.lastDeployed).format('YYYY-MM-DD HH:mm')}
      </Space>,
    },
    {
      title: '操作',
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link" onClick={() => handleUpLevelHelm(record)}> 升级</Button>
                <Button type="link" onClick={() => handleBackVersionHelm(record)}> 回退</Button>
                <Button type="link" onClick={() => handleUninstallHelm(record)}>卸载</Button>
              </div>
            }
            trigger="click"
            open={popOpen === `${record.name}_${record.namespace}`}
            onOpenChange={newOpen => newOpen ? setPopOpen(`${record.name}_${record.namespace}`) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 回退table列表项
  const helmBackColumns = [
    {
      title: '应用模板',
      width: '20%',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip placement="bottom" className='defaultClass' title={record.chartName}>
            <p className={helmIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '序号',
      // width: '10%',
      key: 'version',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle" className='defaultHelmIndexClass'>
          <p className={helmIndexVersion === record.version ? 'now_version' : ''}>{record.version}</p>
          {helmIndexVersion === record.version ? <div className="back_version_disable">
            <span className="back_version_disable_font">当前版本</span>
          </div> : ''}
        </Space>
      ),
    },
    {
      title: 'chart',
      ellipsis: true,
      width: '25%',
      key: 'chart',
      render: (_, record) => (
        <Space size="middle" className='defaultHelmIndexClass'>
          <Tooltip placement="bottom" title={`${record.chartName}-${record.chartVersion}`}>
            <p className={helmIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}-{record.chartVersion}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'createTime',
      width: '25%',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle" className='defaultHelmIndexClass'>
          <p className={helmIndexVersion === record.version ? 'now_version' : ''}>{Dayjs(record.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
        </Space>
      ),
    },
  ];

  // 获取helmList
  const getHelmsList = useCallback(async (isChange = true) => {
    setHelmLoading(true);
    try {
      const res = await getHelmsData(false);
      if (res.status === ResponseCode.OK) {
        setOriginalList(res.data?.data?.items ? [...res.data.data.items] : []);
        handleSearchHelm(res.data.data.items, isChange);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setHelmList([]); // 数组为空
      }
    }
    setHelmLoading(false);
  }, [nowNamespace]);

  // 检索
  const handleSearchHelm = (totalData = originalList, isChange = true) => {
    const helmFormName = helmForm.getFieldValue('helm_name');
    let temporyList = totalData ? totalData : [];
    if (helmFormName) {
      temporyList = temporyList.filter(item => (item.name).toLowerCase().includes(helmFormName.toLowerCase()));
    }
    setHelmList([...temporyList]);
    isChange ? setHelmPage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleHelmTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterHelmValue(filter.helmState);
      }
    },
    []
  );

  useEffect(() => {
    getHelmsList();
  }, [getHelmsList]);

  useEffect(() => {
    if (location && location.state.status) {
      setFilterHelmValue([location.state.status.toLowerCase()]);
      window.history.replaceState(null, '');
    }
  }, [location]);

  useEffect(() => {
    let statusArr = [];
    manageStatusFilterOptions.map(item => {
      statusArr.push({ text: item, value: item });
    });
    setFilterHelmStatus([...statusArr]);
  }, []);
  return <div className="child_content withBread_content overview">
    {contextHolder}
    <div className="helm-tab-top">
      <BreadCrumbCom className="create_bread" items={[{ title: '应用管理', path: `/${containerRouterPrefix}/applicationManageHelm` }]} />
    </div>
    <ToolTipComponent>
      <span>Helm应用是通过helm chart进行快速部署的应用实例，您可以便捷地进行升级、回退和卸载等操作。</span>
    </ToolTipComponent>
    <div className="helm-tab-container">
      <Form className="helm-searchForm form_padding_bottom" form={helmForm}>
        <Form.Item name="helm_name" className="helm-search-input">
          <Input.Search placeholder="搜索Helm名称" onSearch={() => handleSearchHelm()} autoComplete="off" maxLength={53} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleHelmReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={helmLoading}
            columns={helmColumns}
            dataSource={helmList}
            onChange={handleHelmTableChange}
            pagination={{
              className: 'page',
              current: helmPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: (page) => setHelmPage(page),
            }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="卸载应用"
        open={helmIndexUninstallModal}
        cancelFn={helmIndexCancelModal}
        confirmText={'卸载'}
        content={[
          '卸载后将无法恢复，请谨慎操作。',
          `确定卸载应用 ${helmIndexUninstallName} 吗？`,
        ]}
        isCheck={isUninstallDelCheck}
        checkFn={handleUninstallCheckFn}
        onceClick={onceClick}
        showCheck={true}
        confirmFn={handleHelmIndexConfirmUninstall} />
      <ManagementBackRepoModal
        title="应用回退"
        open={helmIndexBackModal}
        name={helmIndexBackName}
        version={helmIndexBackAppVersion}
        dataSource={releaseHistoryList}
        cancelFn={helmIndexBackCancelModal}
        tableColumns={helmBackColumns}
        confirmFn={handleHelmIndexConfirmBack}
        rowSelection={rowSelection}
      />

    </div>
  </div>;
}