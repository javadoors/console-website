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

import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import ExtendDetailInfor from '@/pages/container/extendManage/extend/detail/ExtendDetailInfor';
import ExtendDetailYaml from '@/pages/container/extendManage/extend/detail/ExtendDetailYaml';
import ExtendDetailResource from '@/pages/container/extendManage/extend/detail/ExtendDetailResource';
import ExtendDetailLog from '@/pages/container/extendManage/extend/detail/ExtendDetailLog';
import ExtendDetailEvent from '@/pages/container/extendManage/extend/detail/ExtendDetailEvent';
import ExtendDetailMonitor from '@/pages/container/extendManage/extend/detail/ExtendDetailMonitor';
import { Tabs, Button, Popover, Space, message, Tooltip } from 'antd';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined, PlayCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import '@/styles/pages/extend.less';
import extendLogo from '@/assets/images/helmIcon.png';
import { getHelmDetailDescriptionData, getHelmHistoryVersionData, rollBackHelmVersion, deleteRelease } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ManagementBackRepoModal from '@/components/applicationManagement/ManagementBackRepoModal';
import AnnotationModal from '@/components/AnnotationModal';
import Dayjs from 'dayjs';
import { jsonToYaml } from '@/tools/utils';

export default function ExtendDetail() {
  const param = useParams();

  const themeStore = useStore('theme');

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [extendDetailTabKey, setExtendDetailTabKey] = useState('1');

  const [extendPopOpen, setExtendPopOpen] = useState(false); // 气泡悬浮

  const [extendDetailData, setExtendDetailData] = useState({}); // 详情数据

  const [extendDetailDescript, setExtendDetailDescript] = useState({}); // 顶部描述

  const [extendDetailIcon, setExtendDetailIcon] = useState('');

  const [extendIndexUninstallModal, setExtendIndexUninstallModal] = useState(false); // 卸载的modal框

  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  // 注解与标签
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);

  // 回退部分
  const [releaseHistoryList, setReleaseHistoryList] = useState([]);

  const [checkedNameSpace, setCheckedNameSpace] = useState('');

  const [checkedName, setCheckedName] = useState('');

  const [checkedVersion, setCheckedVersion] = useState(1);

  const [extendIndexBackModal, setExtendIndexBackModal] = useState(false); // 回退的modal框 

  const [extendIndexBackName, setExtendIndexBackName] = useState('');

  const [extendIndexBackAppVersion, setExtendIndexBackAppVersion] = useState('');

  const [extendIndexVersion, setExtendIndexVersion] = useState('');

  const [isEditNow, setIsEditNow] = useState(true); // 是否启停

  const [extendDetailName, setExtendDetailName] = useState(param.extend_name);

  const [extendDetailNamespace, setExtendDetailNamespace] = useState(param.extend_namespace);

  const [pluginShow, setPluginShow] = useState(false);

  const [isUninstallDelCheck, setIsUninstallDelCheck] = useState(false); // 是否选中
  const [uninstallLoading, setUninstallLoding] = useState(false); // 卸载进度

  // 整个项目刷新
  const refreshAllPage = () => {
    window.location.reload(); // 强制页面刷新
  };

  // 处理启停编辑
  const handleReadyOnly = (bool) => {
    setExtendPopOpen(false);
    setIsEditNow(bool);
  };

  // 保存成功后详情info数据刷新
  const handleOkRefresh = () => {
    getExtendDetailList();
    messageApi.open({
      duration: 10,
      content:
        <div className='extend_customize_message'>
          <CheckCircleFilled className='extend_customize_message_icon' />
          <p className='extend_customize_context' style={{ color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>扩展组件发生更新，请刷新以展示最新版本的页面。</p>
          <p className='extend_customize_operate' onClick={refreshAllPage}>点击刷新</p>
        </div>,
    });
  };

  // 取消后详情info数据刷新
  const handleCancelRefresh = () => {
    getExtendDetailList();
  };

  // 获得info子组件的pluginlist数量
  const handlePluginShow = (value) => {
    setPluginShow(value);
  };

  const items = [
    {
      key: '1',
      label: '详情',
      children: <ExtendDetailInfor
        extendName={extendDetailName}
        extendDetailDataProps={extendDetailData}
        isEditNow={isEditNow}
        handleEditFn={handleReadyOnly}
        handleOkRefreshFn={handleOkRefresh}
        handleCancelRefreshFn={handleCancelRefresh}
        handlePluginShow={handlePluginShow} />,
    },
    {
      key: '2',
      label: 'YAML',
      children: <ExtendDetailYaml extendName={extendDetailName} extendNamespace={extendDetailNamespace} />,
    },
    {
      key: '3',
      label: '资源',
      children: <ExtendDetailResource extendName={extendDetailName} extendDetailDataProps={extendDetailData} />,
    },
    {
      key: '4',
      label: '日志',
      children: <ExtendDetailLog extendName={extendDetailName} extendNamespace={extendDetailNamespace} extendDetailDataProps={extendDetailData} />,
    },
    {
      key: '5',
      label: '事件',
      children: <ExtendDetailEvent
        extendName={extendDetailName}
        extendNamespace={extendDetailNamespace}
        extendDetailDataProps={extendDetailData} />,
    },
    {
      key: '6',
      label: '监控',
      children: <ExtendDetailMonitor extendName={extendDetailName} extendDetailDataProps={extendDetailData} />,
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
        <Space size="middle">
          <Tooltip placement="bottom" title={record.chartName}>
            <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      ellipsis: true,
      title: '序号',
      key: 'version',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendDetailClass'>
          <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.version}</p>
          {extendIndexVersion === record.version ? <div className="back_version_disable">
            <span className="back_version_disable_font defaultExtendDetailClass">当前版本</span>
          </div> : ''}
        </Space>
      ),
    },
    {
      title: 'chart',
      width: '25%',
      ellipsis: true,
      key: 'chart',
      render: (_, record) => (
        <Space size="middle" className='defaultExtendDetailClass'>
          <Tooltip placement="bottom" title={`${record.chartName}-${record.chartVersion}`}>
            <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{record.chartName}-{record.chartVersion}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      width: '25%',
      title: '更新时间',
      dataIndex: 'createTime',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle" className='defaultExtendIndexClass'>
          <p className={extendIndexVersion === record.version ? 'now_version' : ''}>{Dayjs(record.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
        </Space>
      ),
    },
  ];

  const handleSetExtendDetailTabKey = (key) => {
    setExtendDetailTabKey(key);
  };

  // 气泡
  const handleExtendPopOpenChange = (open) => {
    setExtendPopOpen(open);
  };

  // 升级按钮
  const handleUpLevelExtend = () => {
    history.push(`/${containerRouterPrefix}/extendManage/upLevel/${extendDetailNamespace}/${extendDetailName}`);
  };

  // 卸载按钮
  const handleUninstallExtend = () => {
    setExtendPopOpen(false);
    setExtendIndexUninstallModal(true);
  };

  // 卸载model的确定按钮
  const handleExtendIndexConfirmUninstall = async () => {
    try {
      setUninstallLoding(true);
      const res = await deleteRelease(extendDetailNamespace, extendDetailName);
      // 中间态
      if (res.status === ResponseCode.OK) {
        setUninstallLoding(false);
        messageApi.success('卸载成功');
        setTimeout(() => {
          setExtendIndexUninstallModal(false);
          setIsUninstallDelCheck(false);
          history.push(`/${containerRouterPrefix}/extendManage`);
        }, 2000);
      }
    } catch (extendDetailError) {
      setUninstallLoding(false);
      if (extendDetailError.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
    }
  };

  // 卸载model的取消按钮
  const extendDetailCancelModal = () => {
    if (uninstallLoading) {
      messageApi.loading('卸载中...');
      setExtendIndexUninstallModal(false);
    } else {
      setExtendIndexUninstallModal(false);
      setIsUninstallDelCheck(false);
    }
  };

  // 取消卸载
  const handleUninstallCheckFn = (e) => {
    setIsUninstallDelCheck(e.target.checked);
  };

  // 回退按钮
  const handleBackVersionExtend = () => {
    getExtendHistoryVersionList();
    setExtendPopOpen(false);
    setExtendIndexBackModal(true);
  };

  // 回退model的确定按钮
  const handleExtendDetailConfirmBack = async () => {
    setExtendIndexBackModal(false);
    try {
      const res = await rollBackHelmVersion(checkedNameSpace, checkedName, checkedVersion);
      if (res.status === ResponseCode.OK) {
        messageApi.success('回退版本成功');
        setExtendIndexBackModal(false);
        getExtendDetailList();
      }
    } catch (extendDetailError) {
      if (extendDetailError.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('回退版本失败');
      }
      setExtendIndexBackModal(false);
    }
  };

  const extendDetailBackCancelModal = () => {
    setExtendIndexBackModal(false);
  };

  // 回退选择
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setCheckedName(selectedRows[0].name);
      setCheckedVersion(selectedRows[0].version);
      setCheckedNameSpace(selectedRows[0].namespace);
    },
    getCheckboxProps: (record) => ({
      disabled: extendIndexVersion === record.version,
      name: record.version,
    }),
  };

  // 回退数据获取extendHistoryVersionList
  const getExtendHistoryVersionList = useCallback(async () => {
    try {
      const res = await getHelmHistoryVersionData(extendDetailNamespace, extendDetailName);
      if (res.status === ResponseCode.OK) {
        const arrExtendDetail = res.data.data.map((item, index) => {
          return {
            ...item,
            key: index + 1,
          };
        });
        setReleaseHistoryList(arrExtendDetail);
      }
    } catch (e) {
      setReleaseHistoryList([]);
    }
  }, []);

  // 详情信息获取
  const getExtendDetailList = useCallback(async () => {
    if (extendDetailName) {
      setDetailLoded(false);
      const res = await getHelmDetailDescriptionData(extendDetailNamespace, extendDetailName);
      if (res.status === ResponseCode.OK) {
        setExtendIndexVersion(res.data.data.version);
        setExtendIndexBackAppVersion(res.data.data.chart.metadata.appVersion);
        setExtendIndexBackName(res.data.data.name);
        setExtendDetailDescript(res.data.data.chart.metadata.description);
        setExtendDetailIcon(res.data.data.chart.metadata.icon);
        setExtendDetailData(res.data.data);
      }
      setDetailLoded(true);
    }
  }, [extendDetailName]);

  useEffect(() => {
    getExtendDetailList();
  }, [getExtendDetailList]);

  return <div className="child_content withBread_content extend_all">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[{ title: '扩展组件管理', path: `/${containerRouterPrefix}/extendManage` }, { title: '详情', path: `/${containerRouterPrefix}/extendManage/detail` }]} />
    <div className='extend_detail_title' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <div style={{ display: 'flex' }}>
        <div>
          {extendDetailIcon ? <img src={extendDetailIcon} alt="" style={{ height: '30px', width: '30px', marginRight: '8px' }} onError={(e) => e.target.src = extendLogo} className='title_image' />
            : <img src={extendLogo} alt="" style={{ height: '30px', width: '30px', marginRight: '8px' }} className='title_image' />}
        </div>
        <div className='extend_descript_group'>
          <div style={{ marginRight: '64px' }}>
            <h3 className='descript_group_name'>{extendDetailName}</h3>
          </div>
          <div style={{ marginRight: '64px' }}>
            <p className='descript_group_description'>{extendDetailDescript}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <Popover placement='bottom'
          content={
            <Space className='column_pop'>
              <Button type="link" onClick={handleUpLevelExtend}>升级</Button>
              <Button type="link" onClick={handleBackVersionExtend}>回退</Button>
              <Button disabled={(extendDetailData.info?.status === 'failed' || !pluginShow)} type="link" onClick={() => handleReadyOnly(false)}>界面启停</Button>
              <Button type="link" onClick={handleUninstallExtend}>卸载</Button>
            </Space>
          }
          open={extendPopOpen && isEditNow}
          onOpenChange={handleExtendPopOpenChange}>
          <Button className={isEditNow ? 'primary_btn' : 'disable_btn'} disabled={!isEditNow} >操作 <DownOutlined className='small_margin_adjust' /></Button>
        </Popover>
      </div>
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetExtendDetailTabKey} activeKey={extendDetailTabKey} destroyInactiveTabPane={true} size='small'></Tabs>}
    <DeleteInfoModal
      title="卸载扩展组件"
      open={extendIndexUninstallModal}
      cancelFn={extendDetailCancelModal}
      content={[
        '卸载后将无法恢复，请谨慎操作。',
        `确定卸载扩展组件 ${extendDetailName} 吗？`,
      ]}
      confirmBtnStatus={uninstallLoading}
      confirmText={'卸载'}
      isCheck={isUninstallDelCheck}
      showCheck={true}
      checkFn={handleUninstallCheckFn}
      confirmFn={handleExtendIndexConfirmUninstall} />
    <ManagementBackRepoModal
      version={extendIndexBackAppVersion}
      open={extendIndexBackModal}
      cancelFn={extendDetailBackCancelModal}
      title="应用回退"
      name={extendIndexBackName}
      tableColumns={extendBackColumns}
      dataSource={releaseHistoryList}
      rowSelection={rowSelection}
      confirmFn={handleExtendDetailConfirmBack}
    />
  </div>;
}