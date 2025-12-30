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
import Detail from '@/pages/container/platformManage/namespace/detail/Detail';
import NamespaceDetailYaml from '@/pages/container/platformManage/namespace/detail/NamespaceDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getNamespaceDetailDescription, deleteNamespace, editAnnotationsOrLabels } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function NamespaceDetail() {
  const { namespaceName, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [namespaceDelModalOpen, setNamespaceDelModalOpen] = useState(false); // 删除对话框展示
  const [isNamespaceDelCheck, setIsNamespaceDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [namespaceDetailTabKey, setNamespaceDetailTabKey] = useState(activeKey || 'detail');

  const [namespaceDetailData, setNamespaceDetailData] = useState({}); // 详情数据

  const [namespacePopOpen, setNamespacePopOpen] = useState(false); // 气泡悬浮
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读
  const [oldAnnotations, setOldAnnotataions] = useState();
  const [oldLabels, setOldLabels] = useState();
  const [namespaceYaml, setNamespaceYaml] = useState('');
  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleNamespacePopOpenChange = (open) => {
    setNamespacePopOpen(open);
  };

  const handleSetNamespaceDetailTabKey = (key) => {
    setNamespaceDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteNamespace = () => {
    setNamespacePopOpen(false); // 气泡框
    setNamespaceDelModalOpen(true); // 打开弹窗
  };

  const handleDelpNamespaceCancel = () => {
    setNamespaceDelModalOpen(false);
  };

  const handleDelNamespaceConfirm = async () => {
    try {
      const res = await deleteNamespace(namespaceName);
      if (res.status === ResponseCode.OK) {
        setNamespaceDelModalOpen(false);
        messageApi.success('删除成功！');
        setTimeout(() => {
          history.push(`/${containerRouterPrefix}/namespace/namespaceManage`);
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

  const handleNamespaceCheckFn = (e) => {
    setIsNamespaceDelCheck(e.target.checked);
  };

  const getNamespaceDetailInfo = useCallback(async () => {
    if (namespaceName) {
      setDetailLoded(false);
      const res = await getNamespaceDetailDescription(namespaceName);
      if (res.status === ResponseCode.OK) {
        setNamespaceYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setNamespaceDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [namespaceName]);

  // 注解成功回调
  const handleNamespaceDetailAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      const namespaceDetailAnnKeyArr = [];
      data.map(item => namespaceDetailAnnKeyArr.push(item.key));
      if (namespaceDetailAnnKeyArr.filter((item, index) => namespaceDetailAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addNamespaceAnnList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('namespace', '', namespaceName, addNamespaceAnnList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getNamespaceDetailInfo();
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
  const handleNamespaceDetailAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setNamespacePopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setNamespacePopOpen(false);
  };

  // 标签失败回调
  const handleNamespaceDetailLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 标签成功回调
  const handleNamespaceDetailLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const namespaceDetailLabKeyArr = [];
      data.map(item => namespaceDetailLabKeyArr.push(item.key));
      if (namespaceDetailLabKeyArr.filter((item, index) => namespaceDetailLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addNamespaceLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('namespace', '', namespaceName, addNamespaceLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getNamespaceDetailInfo();
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

  const handleModify = () => {
    setNamespaceDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Detail
        namespaceName={namespaceName}
        namespaceDetailDataProps={namespaceDetailData}
        refreshFn={getNamespaceDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <NamespaceDetailYaml
        namespaceYamlProps={namespaceYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getNamespaceDetailInfo}
      />,
    },
  ];

  useEffect(() => {
    if (namespaceDetailTabKey === 'detail' || activeKey) {
      getNamespaceDetailInfo();
    }
  }, [namespaceDetailTabKey, getNamespaceDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return <div className='child_content'>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '命名空间', path: `/${containerRouterPrefix}/namespace/namespaceManage`, disabled: true },
      { title: 'Namespace', path: `/` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{namespaceName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type='link' onClick={handleModify}>修改</Button>
            <Button type='link' onClick={handleEditLabel}>编辑标签</Button>
            <Button type='link' onClick={handleEditAnnotation}>编辑注解</Button>
            <Button type='link' onClick={handleDeleteNamespace}>删除</Button>
          </Space>
        }
        open={namespacePopOpen}
        onOpenChange={handleNamespacePopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type='annotation' dataList={namespaceDetailData?.metadata.annotations} callbackOk={handleNamespaceDetailAnnotationOk} callbackCancel={handleNamespaceDetailAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type='label' dataList={namespaceDetailData?.metadata.labels} callbackOk={handleNamespaceDetailLabelOk} callbackCancel={handleNamespaceDetailLabelCancel} />}
      <DeleteInfoModal
        title='删除命名空间'
        open={namespaceDelModalOpen}
        cancelFn={handleDelpNamespaceCancel}
        content={[
          '删除命名空间后将无法恢复，同时会删除namespace下的所有pod、服务和其他资源，请谨慎操作。',
          `确定删除命名空间 ${namespaceName} 吗？`,
        ]}
        isCheck={isNamespaceDelCheck}
        showCheck={true}
        checkFn={handleNamespaceCheckFn}
        confirmFn={handleDelNamespaceConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetNamespaceDetailTabKey} activeKey={namespaceDetailTabKey}></Tabs>}
  </div>;
}