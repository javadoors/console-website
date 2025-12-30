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
import HelmDetailInfor from '@/pages/container/applicationManage/helm/detail/HelmDetailInfor';
import HelmDetailYaml from '@/pages/container/applicationManage/helm/detail/HelmDetailYaml';
import HelmDetailResource from '@/pages/container/applicationManage/helm/detail/HelmDetailResource';
import HelmDetailLog from '@/pages/container/applicationManage/helm/detail/HelmDetailLog';
import HelmDetailEvent from '@/pages/container/applicationManage/helm/detail/HelmDetailEvent';
import HelmDetailMonitor from '@/pages/container/applicationManage/helm/detail/HelmDetailMonitor';
import { Tabs, Button, Popover, Space, message, Tooltip } from 'antd';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined, PlayCircleOutlined } from '@ant-design/icons';
import '@/styles/pages/helm.less';
import helmIcon from '@/assets/images/helmIcon.png';
import { getHelmDetailDescriptionData, getHelmHistoryVersionData, rollBackHelmVersion, deleteRelease } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ManagementBackRepoModal from '@/components/applicationManagement/ManagementBackRepoModal';
import AnnotationModal from '@/components/AnnotationModal';
import Dayjs from 'dayjs';
import { jsonToYaml } from '@/tools/utils';

export default function HelmDetail() {
  const param = useParams();
  const themeStore = useStore('theme');
  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [helmDetailTabKey, setHelmDetailTabKey] = useState('1');

  const [helmPopOpen, setHelmPopOpen] = useState(false); // 气泡悬浮

  const [helmDetailData, setHelmDetailData] = useState({}); // 详情数据

  const [helmDetailDescript, setHelmDetailDescript] = useState({}); // 顶部描述

  const [helmDetailIcon, setHelmDetailIcon] = useState('');

  const [helmDetailUninstallModal, setHelmDetailUninstallModal] = useState(false); // 卸载的modal框

  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  // 注解与标签
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);

  // 回退部分
  const [releaseHistoryList, setReleaseHistoryList] = useState([]);

  const [checkedNameSpace, setCheckedNameSpace] = useState('');

  const [checkedName, setCheckedName] = useState('');

  const [checkedVersion, setCheckedVersion] = useState(1);

  const [helmDetailBackModal, setHelmDetailBackModal] = useState(false); // 回退的modal框 

  const [helmDetailBackName, setHelmDetailBackName] = useState('');

  const [helmDetailBackAppVersion, setHelmDetailBackAppVersion] = useState('');

  const [helmDetailVersion, setHelmDetailVersion] = useState('');

  const [helmDetailName, setHelmDetailName] = useState(param.helm_name);

  const [helmDetailNamespace, setHelmDetailNamespace] = useState(param.helm_namespace);

  const [isUninstallDelCheck, setIsUninstallDelCheck] = useState(false); // 是否选中

  const items = [
    {
      key: '1',
      label: '详情',
      children: <HelmDetailInfor helmName={helmDetailName} helmDetailDataProps={helmDetailData} />,
    },
    {
      key: '2',
      label: 'YAML',
      children: <HelmDetailYaml helmName={helmDetailName} helmNamespace={helmDetailNamespace} />,
    },
    {
      key: '3',
      label: '资源',
      children: <HelmDetailResource helmName={helmDetailName} helmDetailDataProps={helmDetailData} />,
    },
    {
      key: '4',
      label: '日志',
      children: <HelmDetailLog helmName={helmDetailName} helmNamespace={helmDetailNamespace} helmDetailDataProps={helmDetailData} />,
    },
    {
      key: '5',
      label: '事件',
      children: <HelmDetailEvent helmName={helmDetailName} helmNamespace={helmDetailNamespace} helmDetailDataProps={helmDetailData} />,
    },
    {
      key: '6',
      label: '监控',
      children: <HelmDetailMonitor helmName={helmDetailName} helmDetailDataProps={helmDetailData} />,
    },
  ];

  // 回退table列表项
  const helmBackColumns = [
    {
      title: '应用模板',
      width: '20%',
      ellipsis: true,
      key: 'name',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip placement="bottom" title={record.chartName}>
            <p className={helmDetailVersion === record.version ? 'now_version' : ''}>{record.chartName}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '序号',
      ellipsis: true,
      key: 'version',
      render: (_, record) => (
        <Space size="middle" className='defaultHelmDetailClass'>
          <p className={helmDetailVersion === record.version ? 'now_version' : ''}>{record.version}</p>
          {helmDetailVersion === record.version ? <div className="back_version_disable">
            <span className="back_version_disable_font defaultHelmDetailClass">当前版本</span>
          </div> : ''}
        </Space>
      ),
    },
    {
      width: '25%',
      ellipsis: true,
      title: 'chart',
      key: 'chart',
      render: (_, record) => (
        <Space size="middle" className='defaultHelmDetailClass'>
          <Tooltip placement="bottom" title={`${record.chartName}-${record.chartVersion}`}>
            <p className={helmDetailVersion === record.version ? 'now_version' : ''}>{record.chartName}-{record.chartVersion}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      width: '25%',
      ellipsis: true,
      dataIndex: 'createTime',
      title: '更新时间',
      render: (_, record) => (
        <Space size="middle" className='defaultHelmDetailClass'>
          <p className={helmDetailVersion === record.version ? 'now_version' : ''}>{Dayjs(record.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
        </Space>
      ),
    },
  ];

  const handleSetHelmDetailTabKey = (key) => {
    setHelmDetailTabKey(key);
  };

  const handleHelmPopOpenChange = (open) => {
    setHelmPopOpen(open);
  };

  // 升级按钮
  const handleUpLevelHelm = () => {
    history.push(`/${containerRouterPrefix}/applicationManageHelm/upLevel/${helmDetailNamespace}/${helmDetailName}`);
  };

  // 卸载按钮
  const handleUninstallHelm = () => {
    setHelmPopOpen(false);
    setHelmDetailUninstallModal(true);
  };

  const handleUninstallCheckFn = (e) => {
    setIsUninstallDelCheck(e.target.checked);
  };

  // 卸载model的确定按钮
  const handleHelmIndexConfirmUninstall = async () => {
    const res = await deleteRelease(helmDetailNamespace, helmDetailName);
    try {
      if (res.status === ResponseCode.OK) {
        messageApi.success('卸载成功');
        setTimeout(() => {
          setHelmDetailUninstallModal(false);
          setIsUninstallDelCheck(false);
          history.push(`/${containerRouterPrefix}/applicationManageHelm`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
    }
  };

  // 卸载model的取消按钮
  const helmDetailCancelModal = () => {
    setHelmDetailUninstallModal(false);
    setIsUninstallDelCheck(false);
  };

  // 回退按钮
  const handleBackVersionHelm = () => {
    getHelmHistoryVersionList();
    setHelmPopOpen(false);
    setHelmDetailBackModal(true);
  };

  // 回退model的确定按钮
  const handleHelmDetailConfirmBack = async () => {
    setHelmDetailBackModal(false);
    try {
      const res = await rollBackHelmVersion(checkedNameSpace, checkedName, checkedVersion);
      if (res.status === ResponseCode.OK) {
        messageApi.success('回退版本成功');
        setHelmDetailBackModal(false);
        getHelmDetailList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('回退版本失败');
      }
      setHelmDetailBackModal(false);
    }
  };

  // 回退model的取消按钮
  const helmDetailBackCancelModal = () => {
    setHelmDetailBackModal(false);
  };

  // 回退选择
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setCheckedNameSpace(selectedRows[0].namespace);
      setCheckedName(selectedRows[0].name);
      setCheckedVersion(selectedRows[0].version);
    },
    getCheckboxProps: (record) => ({
      disabled: helmDetailVersion === record.version,
      name: record.version,
    }),
  };

  // 回退数据获取helmHistoryVersionList
  const getHelmHistoryVersionList = useCallback(async () => {
    try {
      const res = await getHelmHistoryVersionData(helmDetailNamespace, helmDetailName);
      if (res.status === ResponseCode.OK) {
        const arr = res.data.data.map((item, index) => {
          return {
            ...item,
            key: index + 1,
          };
        });
        setReleaseHistoryList(arr);
      }
    } catch (e) {
      setReleaseHistoryList([]);
    }
  }, []);

  // 详情信息获取
  const getHelmDetailList = useCallback(async () => {
    if (helmDetailName) {
      setDetailLoded(false);
      const res = await getHelmDetailDescriptionData(helmDetailNamespace, helmDetailName);
      if (res.status === ResponseCode.OK) {
        setHelmDetailVersion(res.data.data.version);
        setHelmDetailBackAppVersion(res.data.data.chart.metadata.appVersion);
        setHelmDetailBackName(res.data.data.name);
        setHelmDetailDescript(res.data.data.chart.metadata.description);
        setHelmDetailIcon(res.data.data.chart.metadata.icon);
        setHelmDetailData(res.data.data);
      }
      setDetailLoded(true);
    }
  }, [helmDetailName]);

  useEffect(() => {
    getHelmDetailList();
  }, [getHelmDetailList]);

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[{ title: '应用管理', path: `/${containerRouterPrefix}/applicationManageHelm` }, { title: 'Helm详情', path: `/${containerRouterPrefix}/applicationManageHelm/detail` }]} />
    <div className='helm_detail_title'>
      <div style={{ display: 'flex' }}>
        <div>
          {helmDetailIcon ? <img src={helmDetailIcon} alt="" style={{ height: '30px', width: '30px', marginRight: '8px' }} onError={(e) => e.target.src = helmIcon} className='title_image' />
            : <img src={helmIcon} alt="" style={{ height: '30px', width: '30px', marginRight: '8px' }} className='title_image' />}
        </div>
        <div className='descript_group'>
          <div style={{ marginRight: '64px' }}>
            <h3 className='descript_group_name'>{helmDetailName}</h3>
          </div>
          <div style={{ marginRight: '64px' }}>
            <p className='descript_group_description'>{helmDetailDescript}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <Popover placement='bottom'
          content={
            <Space className='column_pop'>
              <Button type="link" onClick={handleUpLevelHelm}>升级</Button>
              <Button type="link" onClick={handleBackVersionHelm}>回退</Button>
              <Button type="link" onClick={handleUninstallHelm}>卸载</Button>
            </Space>
          }
          open={helmPopOpen}
          onOpenChange={handleHelmPopOpenChange}>
          <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
        </Popover>
      </div>
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetHelmDetailTabKey} activeKey={helmDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
    <DeleteInfoModal
      title="卸载应用"
      open={helmDetailUninstallModal}
      cancelFn={helmDetailCancelModal}
      content={[
        '卸载后将无法恢复，请谨慎操作。',
        `确定卸载应用 ${helmDetailName} 吗？`,
      ]}
      confirmText={'卸载'}
      isCheck={isUninstallDelCheck}
      showCheck={true}
      checkFn={handleUninstallCheckFn}
      confirmFn={handleHelmIndexConfirmUninstall} />
    <ManagementBackRepoModal
      title="应用回退"
      name={helmDetailBackName}
      version={helmDetailBackAppVersion}
      open={helmDetailBackModal}
      cancelFn={helmDetailBackCancelModal}
      tableColumns={helmBackColumns}
      dataSource={releaseHistoryList}
      rowSelection={rowSelection}
      confirmFn={handleHelmDetailConfirmBack}
    />
  </div>;
}