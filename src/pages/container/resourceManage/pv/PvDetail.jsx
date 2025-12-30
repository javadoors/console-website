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
import PvDetailInfor from '@/pages/container/resourceManage/pv/PvDetailInfor';
import PvDetailYaml from '@/pages/container/resourceManage/pv/PvDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/resourceManage.less';
import { getPvDetailDescription, deletePv, editPvLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function PvDetail() {
  const { pvName, activeKey } = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [pvTabDeleteModal, setPvTabDeleteModal] = useState(false);

  const [isPvDelCheck, setisPvDelCheck] = useState(false);

  const [pvDetailTabKey, setPvDetailTabKey] = useState(activeKey || 'detail');

  const [pvDetailData, setPvDetailData] = useState({}); // 详情数据

  const [pvYamlData, setPvYamlData] = useState(''); // yaml传递原始数据

  const [pvPopOpen, setPvPopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false); // 注解对话框展示

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false); // 注解对话框展示

  const [detailLoded, setDetailLoded] = useState(false);

  const [isPvReadyOnly, setIsPvReadyOnly] = useState(true); // 是否只读

  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解

  const [oldLabels, setOldLabels] = useState([]);

  const handleSetPvDetailTabKey = (key) => {
    setPvDetailTabKey(key);
    setIsPvReadyOnly(true);
  };

  const handlePvPopOpenChange = (open) => {
    setPvPopOpen(open);
  };

  // 修改
  const handleEditPvYaml = () => {
    setPvDetailTabKey('yaml');
    setIsPvReadyOnly(false);
  };

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsPvReadyOnly(bool);
  };

  const handleDeletePv = () => {
    setPvPopOpen(false);
    setPvTabDeleteModal(true);
  };

  const handleDelpPvCancel = () => {
    setPvTabDeleteModal(false);
  };

  const handleDelpPvConfirm = async () => {
    try {
      const res = await deletePv(pvName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setPvTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/resourceManagement/pv`);
        }, 2000);
      }
    } catch (e) {
      if (e.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, e);
      } else {
        messageApi.error(`删除失败!${e.response.data.message}`);
      }
    }
  };

  const handlePvCheckFn = (e) => {
    setisPvDelCheck(e.target.checked);
  };

  // 获取详情基本信息
  const getPvDetailInfo = useCallback(async () => {
    if (pvName) {
      setDetailLoded(false);
      const res = await getPvDetailDescription(pvName);
      if (res.status === ResponseCode.OK) {
        setPvYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setPvDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [pvName]);

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
          const res = await editPvLabelOrAnnotation(pvName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getPvDetailInfo();
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
          const res = await editPvLabelOrAnnotation(pvName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getPvDetailInfo();
            });
          }
        } catch (e) {
          if (e.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, e);
          } else {
            messageApi.error(`编辑注解失败！${e.response.data.message}`);
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
      children: <PvDetailInfor pvDetailDataProps={pvDetailData} refreshFn={getPvDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <PvDetailYaml
        pvYamlProps={pvYamlData}
        isPvReadyOnly={isPvReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getPvDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (pvDetailTabKey === 'detail' || pvDetailTabKey === 'yaml') {
      getPvDetailInfo();
    }
  }, [getPvDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsPvReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content">
    {contextHolder}
    <BreadCrumbCom items={[
      { title: '存储', path: `/${containerRouterPrefix}/resourceManagement`, disabled: true },
      { title: '数据卷(PV)', path: `/pv` },
      { title: '详情', path: `/pvDetail` },
    ]} />
    <div className='resource-storge_title'>
      <div style={{ marginRight: '64px' }}>
        <h3>{pvName}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditPvYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeletePv}>删除</Button>
          </Space>
        }
        open={pvPopOpen}
        onOpenChange={handlePvPopOpenChange}>
        <Button className='primary_btn detail_title_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={pvDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={pvDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      <DeleteInfoModal
        title="删除数据卷"
        open={pvTabDeleteModal}
        cancelFn={handleDelpPvCancel}
        content={[
          '删除数据卷后将无法恢复，请谨慎操作。',
          `确定删除数据卷 ${pvName} 吗？`,
        ]}
        isCheck={isPvDelCheck}
        showCheck={true}
        checkFn={handlePvCheckFn}
        confirmFn={handleDelpPvConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetPvDetailTabKey} activeKey={pvDetailTabKey}></Tabs>}
  </div>;
}