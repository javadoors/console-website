/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import Detail from '@/pages/container/userManage/serviceAccount/detail/Detail';
import ServiceAccountDetailYaml from '@/pages/container/userManage/serviceAccount/detail/ServiceAccountDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getServiceAccountDetailDescription, editAnnotationsOrLabels, deleteServiceAccount } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';

export default function ServiceAccountDetail() {
  const { serviceAccountName, serviceAccountNamespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [serviceAccountDelModalOpen, setServiceAccountDelModalOpen] = useState(false); // 删除对话框展示
  const [isServiceAccountDelCheck, setIsServiceAccountDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [serviceAccountDetailTabKey, setServiceAccountDetailTabKey] = useState(activeKey || 'detail');

  const [serviceAccountDetailData, setServiceAccountDetailData] = useState({}); // 详情数据

  const [serviceAccountPopOpen, setServiceAccountPopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isServiceAccountAnnotationModalOpen, setIsServiceAccountAnnotationModalOpen] = useState(false);
  const [isServiceAccountLabelModalOpen, setIsServiceAccountLabelModalOpen] = useState(false);
  const [oldServiceAccountAnnotations, setOldServiceAccountAnnotataions] = useState();
  const [oldServiceAccountLabels, setOldServiceAccountLabels] = useState();
  const themeStore = useStore('theme');

  const [serviceAccountYaml, setServiceAccountYaml] = useState(''); // 传递yaml

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleServiceAccountPopOpenChange = (open) => {
    setServiceAccountPopOpen(open);
  };

  const handleSetServiceAccountDetailTabKey = (key) => {
    setServiceAccountDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteServiceAccount = () => {
    setServiceAccountPopOpen(false); // 气泡框
    setServiceAccountDelModalOpen(true); // 打开弹窗
  };

  const handleDelpServiceAccountCancel = () => {
    setServiceAccountDelModalOpen(false);
  };

  const handleDelpServiceAccountConfirm = async () => {
    try {
      const res = await deleteServiceAccount(serviceAccountNamespace, serviceAccountName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setServiceAccountDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/userManage/serviceAccount`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleServiceAccountDetailCheckFn = (e) => {
    setIsServiceAccountDelCheck(e.target.checked);
  };

  const getServiceAccountDetailInfo = useCallback(async () => {
    if (serviceAccountName && serviceAccountNamespace) {
      setDetailLoded(false);
      const res = await getServiceAccountDetailDescription(serviceAccountNamespace, serviceAccountName);
      if (res.status === ResponseCode.OK) {
        setServiceAccountYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldServiceAccountAnnotataions([...res.data.metadata.annotations]);
        setOldServiceAccountLabels([...res.data.metadata.labels]);
        setServiceAccountDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [serviceAccountName, serviceAccountNamespace]);

  const handleModify = () => {
    setServiceAccountDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (serviceAccountData) => {
    if (JSON.stringify(oldServiceAccountAnnotations) === JSON.stringify(serviceAccountData)) {
      messageApi.info('注解未进行修改');
      setIsServiceAccountAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      serviceAccountData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldServiceAccountAnnotations, serviceAccountData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('serviceaccount', serviceAccountNamespace, serviceAccountName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getServiceAccountDetailInfo();
              setIsServiceAccountAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败！${error.response.data.message}`);
          }
        }
      }
    }
  };
  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsServiceAccountAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsServiceAccountAnnotationModalOpen(true);
    setServiceAccountPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsServiceAccountLabelModalOpen(true);
    setServiceAccountPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (serviceAccountData) => {
    if (JSON.stringify(oldServiceAccountLabels) === JSON.stringify(serviceAccountData)) {
      messageApi.info('标签未进行修改');
      setIsServiceAccountLabelModalOpen(false);
    } else {
      const keyArr = [];
      serviceAccountData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldServiceAccountLabels, serviceAccountData, 'label');
        try {
          const res = await editAnnotationsOrLabels('serviceaccount', serviceAccountNamespace, serviceAccountName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getServiceAccountDetailInfo();
              setIsServiceAccountLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsServiceAccountLabelModalOpen(false);
  };

  useEffect(() => {
    if (serviceAccountDetailTabKey === 'detail' || activeKey) {
      getServiceAccountDetailInfo();
    }
  }, [serviceAccountDetailTabKey, getServiceAccountDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Detail
        serviceAccountName={serviceAccountName}
        serviceAccountNamespace={serviceAccountNamespace}
        serviceAccountDetailDataProps={serviceAccountDetailData}
        refreshFn={getServiceAccountDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ServiceAccountDetailYaml
        serviceAccountYamlProps={serviceAccountYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getServiceAccountDetailInfo} />,
    },
  ];

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: 'RBAC管理', path: `/${containerRouterPrefix}/userManage/serviceAccount`, disabled: true },
      { title: '服务账号' },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{serviceAccountName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteServiceAccount}>删除</Button>
          </Space>
        }
        open={serviceAccountPopOpen}
        onOpenChange={handleServiceAccountPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isServiceAccountAnnotationModalOpen} type="annotation" dataList={serviceAccountDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isServiceAccountLabelModalOpen} type="label" dataList={serviceAccountDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除服务账号"
        open={serviceAccountDelModalOpen}
        cancelFn={handleDelpServiceAccountCancel}
        content={[
          '删除服务账号后将无法恢复，请谨慎操作。',
          `确定删除服务账号 ${serviceAccountName} 吗？`,
        ]}
        isCheck={isServiceAccountDelCheck}
        showCheck={true}
        checkFn={handleServiceAccountDetailCheckFn}
        confirmFn={handleDelpServiceAccountConfirm} />
    </div>
    {detailLoded && <Tabs
      items={items}
      onChange={handleSetServiceAccountDetailTabKey}
      activeKey={serviceAccountDetailTabKey}
      destroyInactiveTabPane={true}>
    </Tabs>
    }
  </div>;
}