/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import Detail from '@/pages/container/platformManage/resourceQuota/detail/Detail';
import ResourceQuotaDetailYaml from '@/pages/container/platformManage/resourceQuota/detail/ResourceQuotaDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getResourceQuotaDetailDescription, deleteResourceQuota, editAnnotationsOrLabels } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { jsonToYaml } from '@/tools/utils';

export default function ResourceQuotaDetail() {
  const { resourceQuotaName, resourceQuotaNamespace, activeKey } = useParams();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [resourceQuotaDelModalOpen, setResourceQuotaDelModalOpen] = useState(false); // 删除对话框展示
  const [isResourceQuotaDelCheck, setIsResourceQuotaDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成
  const [resourceQuotaDetailTabKey, setResourceQuotaDetailTabKey] = useState(activeKey || 'detail');
  const [resourceQuotaDetailData, setResourceQuotaDetailData] = useState({}); // 详情数据
  const [resourceQuotaPopOpen, setResourceQuotaPopOpen] = useState(false); // 气泡悬浮
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState();
  const [oldLabels, setOldLabels] = useState();
  const [resourceQuotaYaml, setResourceQuotaYaml] = useState(''); // 传递yaml
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleResourceQuotaPopOpenChange = (open) => {
    setResourceQuotaPopOpen(open);
  };

  const handleSetResourceQuotaDetailTabKey = (key) => {
    setResourceQuotaDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteResourceQuota = () => {
    setResourceQuotaPopOpen(false); // 气泡框
    setResourceQuotaDelModalOpen(true); // 打开弹窗
  };

  const handleDelpResourceQuotaCancel = () => {
    setResourceQuotaDelModalOpen(false);
  };

  const handleDelResourceQuotaConfirm = async () => {
    try {
      const res = await deleteResourceQuota(resourceQuotaNamespace, resourceQuotaName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setResourceQuotaDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/namespace/resourceQuota`);
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

  const handleResourceQuotaCheckFn = (e) => {
    setIsResourceQuotaDelCheck(e.target.checked);
  };

  const getResourceQuotaDetailInfo = useCallback(async () => {
    if (resourceQuotaName && resourceQuotaNamespace) {
      setDetailLoded(false);
      const res = await getResourceQuotaDetailDescription(resourceQuotaNamespace, resourceQuotaName);
      if (res.status === ResponseCode.OK) {
        setResourceQuotaYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setResourceQuotaDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [resourceQuotaName, resourceQuotaNamespace]);

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', resourceQuotaNamespace, resourceQuotaName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getResourceQuotaDetailInfo();
              setIsAnnotationModalOpen(false);
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
    setIsAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setResourceQuotaPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setResourceQuotaPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', resourceQuotaNamespace, resourceQuotaName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getResourceQuotaDetailInfo();
              setIsLabelModalOpen(false);
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
    setIsLabelModalOpen(false);
  };

  const handleModify = () => {
    setResourceQuotaDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Detail
        resourceQuotaName={resourceQuotaName}
        resourceQuotaNamespace={resourceQuotaNamespace}
        resourceQuotaDetailDataProps={resourceQuotaDetailData}
        refreshFn={getResourceQuotaDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ResourceQuotaDetailYaml
        resourceQuotaYamlProps={resourceQuotaYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getResourceQuotaDetailInfo}
      />,
    },
  ];

  useEffect(() => {
    if (resourceQuotaDetailTabKey === 'detail' || activeKey) {
      getResourceQuotaDetailInfo();
    }
  }, [resourceQuotaDetailTabKey, getResourceQuotaDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '命名空间', path: `/${containerRouterPrefix}/namespace/resourceQuota`, disabled: true },
      { title: 'ResourceQuota', path: `/` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{resourceQuotaName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>编辑标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>编辑注解</Button>
            <Button type="link" onClick={handleDeleteResourceQuota}>删除</Button>
          </Space>
        }
        open={resourceQuotaPopOpen}
        onOpenChange={handleResourceQuotaPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={resourceQuotaDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={resourceQuotaDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除资源配额"
        open={resourceQuotaDelModalOpen}
        cancelFn={handleDelpResourceQuotaCancel}
        content={[
          '删除资源配额后将无法恢复，请谨慎操作。',
          `确定删除资源配额 ${resourceQuotaName} 吗？`,
        ]}
        isCheck={isResourceQuotaDelCheck}
        showCheck={true}
        checkFn={handleResourceQuotaCheckFn}
        confirmFn={handleDelResourceQuotaConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetResourceQuotaDetailTabKey} activeKey={resourceQuotaDetailTabKey}></Tabs>}
  </div>;
}