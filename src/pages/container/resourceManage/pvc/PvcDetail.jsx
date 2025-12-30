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
import PvcDetailInfor from '@/pages/container/resourceManage/pvc/PvcDetailInfor';
import PvcDetailYaml from '@/pages/container/resourceManage/pvc/PvcDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/resourceManage.less';
import { getPvcDetailDescription, deletePvc, editPvcLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function PvcDetail() {
  const { pvcName, pvcNamespace, activeKey } = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [pvcTabDeleteModal, setPvcTabDeleteModal] = useState(false);

  const [isPvcDelCheck, setisPvcDelCheck] = useState(false);

  const [pvcDetailTabKey, setPvcDetailTabKey] = useState(activeKey || 'detail');

  const [pvcDetailData, setPvcDetailData] = useState({}); // 详情数据

  const [pvcYamlData, setPvcYamlData] = useState(''); // yaml传递原始数据

  const [pvcPopOpen, setPvcPopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false); // 注解对话框展示

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false); // 注解对话框展示

  const [detailLoded, setDetailLoded] = useState(false);

  const [isPvcReadyOnly, setIsPvcReadyOnly] = useState(true); // 是否只读

  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解

  const [oldLabels, setOldLabels] = useState([]);

  const handleSetPvcDetailTabKey = (key) => {
    setPvcDetailTabKey(key);
    setIsPvcReadyOnly(true);
  };

  const handlePvcPopOpenChange = (open) => {
    setPvcPopOpen(open);
  };

  // 修改
  const handleEditPvcYaml = () => {
    setPvcDetailTabKey('yaml');
    setIsPvcReadyOnly(false);
  };

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsPvcReadyOnly(bool);
  };

  const handleDeletePvc = () => {
    setPvcPopOpen(false);
    setPvcTabDeleteModal(true);
  };

  const handleDelpPvcCancel = () => {
    setPvcTabDeleteModal(false);
  };

  const handleDelpPvcConfirm = async () => {
    try {
      const res = await deletePvc(pvcNamespace, pvcName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setPvcTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/resourceManagement/pvc`);
        }, 2000);
      }
    } catch (pvcError) {
      if (pvcError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, pvcError);
      } else {
        messageApi.error(`删除失败!${pvcError.response.data.message}`);
      }
    }
  };

  const handlePvcCheckFn = (e) => {
    setisPvcDelCheck(e.target.checked);
  };

  // 获取详情基本信息
  const getPvcDetailInfo = useCallback(async () => {
    if (pvcNamespace && pvcName) {
      setDetailLoded(false);
      const res = await getPvcDetailDescription(pvcNamespace, pvcName);
      if (res.status === ResponseCode.OK) {
        setPvcYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setPvcDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [pvcName, pvcNamespace]);

  // 标签成功回调
  const handleLabelOk = async (data) => {
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editPvcLabelOrAnnotation(pvcNamespace, pvcName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getPvcDetailInfo();
            }, 1000);
          }
        } catch (e) {
          if (e.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, e);
          } else {
            messageApi.error(`编辑标签失败！${e.response.data.message}`);
          }
        }
      }
    }
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editPvcLabelOrAnnotation(pvcNamespace, pvcName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getPvcDetailInfo();
            });
          }
        } catch (pvce) {
          if (pvce.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, pvce);
          } else {
            messageApi.error(`编辑注解失败！${pvce.response.data.message}`);
          }
        }
      }
    }
  };

  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <PvcDetailInfor pvcDetailDataProps={pvcDetailData} refreshFn={getPvcDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <PvcDetailYaml
        pvcYamlProps={pvcYamlData}
        isPvcReadyOnly={isPvcReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getPvcDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (pvcDetailTabKey === 'detail' || pvcDetailTabKey === 'yaml') {
      getPvcDetailInfo();
    }
  }, [getPvcDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsPvcReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content withBread_content">
    {contextHolder}
    <BreadCrumbCom items={[
      { title: '存储', path: `/${containerRouterPrefix}/resourceManagement`, disabled: true },
      { title: '数据卷声明(PVC)', path: `/pvc` },
      { title: '详情', path: `/pvcDetail` },
    ]} />
    <div className='resource-storge_title'>
      <div style={{ marginRight: '64px' }}>
        <h3>{pvcName}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditPvcYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeletePvc}>删除</Button>
          </Space>
        }
        open={pvcPopOpen}
        onOpenChange={handlePvcPopOpenChange}>
        <Button className='primary_btn detail_title_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={pvcDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={pvcDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      <DeleteInfoModal
        title="删除数据卷声明"
        open={pvcTabDeleteModal}
        cancelFn={handleDelpPvcCancel}
        content={[
          '删除数据卷声明后将无法恢复，请谨慎操作。',
          `确定删除数据卷声明 ${pvcName} 吗？`,
        ]}
        isCheck={isPvcDelCheck}
        showCheck={true}
        checkFn={handlePvcCheckFn}
        confirmFn={handleDelpPvcConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetPvcDetailTabKey} activeKey={pvcDetailTabKey}></Tabs>}
  </div>;
}