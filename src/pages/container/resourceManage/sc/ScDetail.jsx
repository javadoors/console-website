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
import ScDetailInfor from '@/pages/container/resourceManage/sc/ScDetailInfor';
import ScDetailYaml from '@/pages/container/resourceManage/sc/ScDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/resourceManage.less';
import { getScDetailDescription, deleteSc, editScLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function ScDetail() {
  const { scName, activeKey } = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [scTabDeleteModal, setScTabDeleteModal] = useState(false);

  const [isScDelCheck, setisScDelCheck] = useState(false);

  const [scDetailTabKey, setScDetailTabKey] = useState(activeKey || 'detail');

  const [scDetailData, setScDetailData] = useState({}); // 详情数据

  const [scYamlData, setScYamlData] = useState(''); // yaml传递原始数据

  const [scPopOpen, setScPopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false); // 注解对话框展示

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false); // 注解对话框展示

  const [detailLoded, setDetailLoded] = useState(false);

  const [isScReadyOnly, setIsScReadyOnly] = useState(true); // 是否只读

  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解

  const [oldLabels, setOldLabels] = useState([]);

  const handleSetScDetailTabKey = (key) => {
    setScDetailTabKey(key);
    setIsScReadyOnly(true);
  };

  const handleScPopOpenChange = (open) => {
    setScPopOpen(open);
  };

  // 修改
  const handleEditScYaml = () => {
    setScDetailTabKey('yaml');
    setIsScReadyOnly(false);
  };

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsScReadyOnly(bool);
  };

  const handleDeleteSc = () => {
    setScPopOpen(false);
    setScTabDeleteModal(true);
  };

  const handleDelpScCancel = () => {
    setScTabDeleteModal(false);
  };

  const handleDelpScConfirm = async () => {
    try {
      const res = await deleteSc(scName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setScTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/resourceManagement/sc`);
        }, 2000);
      }
    } catch (scError) {
      if (scError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, scError);
      } else {
        messageApi.error(`删除失败!${scError.response.data.message}`);
      }
    }
  };

  const handleScCheckFn = (e) => {
    setisScDelCheck(e.target.checked);
  };

  // 获取详情基本信息
  const getScDetailInfo = useCallback(async () => {
    if (scName) {
      setDetailLoded(false);
      const res = await getScDetailDescription(scName);
      if (res.status === ResponseCode.OK) {
        setScYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setScDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [scName]);

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
          const res = await editScLabelOrAnnotation(scName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getScDetailInfo();
            }, 1000);
          }
        } catch (scError) {
          if (scError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, scError);
          } else {
            messageApi.error(`编辑标签失败！${scError.response.data.message}`);
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
          const res = await editScLabelOrAnnotation(scName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getScDetailInfo();
            });
          }
        } catch (scError) {
          if (scError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, scError);
          } else {
            messageApi.error(`编辑注解失败！${scError.response.data.message}`);
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
      children: <ScDetailInfor scDetailDataProps={scDetailData} refreshFn={getScDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ScDetailYaml
        scYamlProps={scYamlData}
        isScReadyOnly={isScReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getScDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (scDetailTabKey === 'detail' || scDetailTabKey === 'yaml') {
      getScDetailInfo();
    }
  }, [getScDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsScReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content">
    {contextHolder}
    <BreadCrumbCom items={[
      { title: '存储', path: `/${containerRouterPrefix}/resourceManagement`, disabled: true },
      { title: '存储池(SC)', path: `/sc` },
      { title: '详情', path: `/scDetail` },
    ]} />
    <div className='resource-storge_title'>
      <div style={{ marginRight: '64px' }}>
        <h3>{scName}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditScYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeleteSc}>删除</Button>
          </Space>
        }
        open={scPopOpen}
        onOpenChange={handleScPopOpenChange}>
        <Button className='primary_btn detail_title_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={scDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={scDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      <DeleteInfoModal
        title="删除存储池"
        open={scTabDeleteModal}
        cancelFn={handleDelpScCancel}
        content={[
          '删除存储池后将无法恢复，请谨慎操作。',
          `确定删除存储池 ${scName} 吗？`,
        ]}
        isCheck={isScDelCheck}
        showCheck={true}
        checkFn={handleScCheckFn}
        confirmFn={handleDelpScConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetScDetailTabKey} activeKey={scDetailTabKey}></Tabs>}
  </div>;
}