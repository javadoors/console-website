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
import IngressDetailInfor from '@/pages/container/network/ingress/IngressDetailInfor';
import IngressDetailYaml from '@/pages/container/network/ingress/IngressDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/network.less';
import { getIngressDetailDescription, deleteIngress, editIngressLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function IngressDetail() {
  const themeStore = useStore('theme');
  const { ingress_name, ingress_namespace, activeKey } = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [ingressTabDeleteModal, setIngressTabDeleteModal] = useState(false);

  const [isIngressDelCheck, setisIngressDelCheck] = useState(false);

  const [ingressDetailTabKey, setIngressDetailTabKey] = useState(activeKey || 'detail');

  const [ingressDetailData, setIngressDetailData] = useState({}); // 详情数据

  const [ingressYamlData, setIngressYamlData] = useState(''); // yaml传递原始数据

  const [ingressPopOpen, setIngressPopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false); // 注解对话框展示

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false); // 注解对话框展示

  const [detailLoded, setDetailLoded] = useState(false);

  const [isIngressReadyOnly, setIsIngressReadyOnly] = useState(true); // 是否只读

  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解

  const [oldLabels, setOldLabels] = useState([]);

  const [ingressNamespace, setIngressNamespace] = useState(ingress_namespace);

  const [ingressName, setIngressName] = useState(ingress_name);

  const handleSetIngressDetailTabKey = (key) => {
    setIngressDetailTabKey(key);
    setIsIngressReadyOnly(true);
  };

  const handleIngressPopOpenChange = (open) => {
    setIngressPopOpen(open);
  };

  // 修改
  const handleEditIngressYaml = () => {
    setIngressDetailTabKey('yaml');
    setIsIngressReadyOnly(false);
  };

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsIngressReadyOnly(bool);
  };

  const handleDeleteIngress = () => {
    setIngressPopOpen(false);
    setIngressTabDeleteModal(true);
  };

  const handleDelpIngressCancel = () => {
    setIngressTabDeleteModal(false);
  };

  const handleDelpIngressConfirm = async () => {
    try {
      const res = await deleteIngress(ingressNamespace, ingressName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setIngressTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/network/ingress`);
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

  const handleIngressCheckFn = (e) => {
    setisIngressDelCheck(e.target.checked);
  };

  // 获取详情基本信息
  const getIngressDetailInfo = useCallback(async () => {
    if (ingressNamespace && ingressName) {
      setDetailLoded(false);
      const res = await getIngressDetailDescription(ingressNamespace, ingressName);
      if (res.status === ResponseCode.OK) {
        setIngressYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setIngressDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [ingressName, ingressNamespace]);

  // 标签成功回调
  const handleIngressLabelOk = async (data) => {
    const ingressLabKeyArr = [];
    data.map(item => ingressLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      if (ingressLabKeyArr.filter((item, index) => ingressLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addIngressLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editIngressLabelOrAnnotation(ingressNamespace, ingressName, addIngressLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getIngressDetailInfo();
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 标签失败回调
  const handleIngressLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 注解成功回调
  const handleIngressAnnotationOk = async (data) => {
    const ingressAnnKeyArr = [];
    data.map(item => ingressAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      if (ingressAnnKeyArr.filter((item, index) => ingressAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addIngressAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editIngressLabelOrAnnotation(ingressNamespace, ingressName, addIngressAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getIngressDetailInfo();
            });
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 注解失败回调
  const handleIngressAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <IngressDetailInfor ingressDetailDataProps={ingressDetailData} refreshFn={getIngressDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <IngressDetailYaml
        ingressYamlProps={ingressYamlData}
        isIngressReadyOnly={isIngressReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getIngressDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (ingressDetailTabKey === 'detail' || ingressDetailTabKey === 'yaml') {
      getIngressDetailInfo();
    }
  }, [getIngressDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsIngressReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '网络', path: `/${containerRouterPrefix}/network`, disabled: true },
      { title: 'Ingress', path: `/ingress` },
      { title: '详情', path: `/ingressDetail` },
    ]} />
    <div className='network_title'>
      <div style={{ marginRight: '64px' }}>
        <h3>{ingressName}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditIngressYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeleteIngress}>删除</Button>
          </Space>
        }
        open={ingressPopOpen}
        onOpenChange={handleIngressPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={ingressDetailData?.metadata?.labels} callbackOk={handleIngressLabelOk} callbackCancel={handleIngressLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={ingressDetailData?.metadata?.annotations} callbackOk={handleIngressAnnotationOk} callbackCancel={handleIngressAnnotationCancel} />}
      <DeleteInfoModal
        title="删除Ingress"
        open={ingressTabDeleteModal}
        cancelFn={handleDelpIngressCancel}
        content={[
          '删除Ingress后将无法恢复，请谨慎操作。',
          `确定删除Ingress ${ingressName} 吗？`,
        ]}
        isCheck={isIngressDelCheck}
        showCheck={true}
        checkFn={handleIngressCheckFn}
        confirmFn={handleDelpIngressConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetIngressDetailTabKey} activeKey={ingressDetailTabKey}></Tabs>}
  </div>;
}