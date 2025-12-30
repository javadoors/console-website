/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useCallback, useEffect, useState, useStore } from 'openinula';
import { ResponseCode } from '@/common/constants';
import Dayjs from 'dayjs';
import { EditOutlined, InfoCircleFilled } from '@ant-design/icons';
import { ConfigProvider, Tag, message, Table, Space } from 'antd';
import AnnotationModal from '@/components/AnnotationModal';
import { editPvLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import '@/styles/pages/resourceManage.less';

export default function Detail({ pvDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [pvDetailInfoData, setPvDetailData] = useState(pvDetailDataProps); // 详情数据

  const [oldAnnotations, setOldAnnotations] = useState(pvDetailDataProps.metadata.annotations); // 未修改前注解

  const [oldLabels, setOldLabels] = useState(pvDetailDataProps.metadata.labels);

  const themeStore = useStore('theme');

  // 标签对话框展示
  const [isPvLabelModalOpen, setIsPvLabelModalOpen] = useState(false);
  // 注解对话框展示
  const [isPvAnnotationModalOpen, setIsPvAnnotationModalOpen] = useState(false);

  // 标签成功回调
  const handlePvLabelOk = async (data) => {
    const pvLabKeyArr = [];
    data.map(item => pvLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsPvLabelModalOpen(false);
    } else {
      if (pvLabKeyArr.filter((item, index) => pvLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editPvLabelOrAnnotation(pvDetailInfoData.metadata.name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsPvLabelModalOpen(false);
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
  const handlePvLabelCancel = () => {
    setIsPvLabelModalOpen(false);
  };

  // 注解成功回调
  const handlePvAnnotationOk = async (data) => {
    const pvAnnKeyArr = [];
    data.map(item => pvAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsPvAnnotationModalOpen(false);
    } else {
      if (pvAnnKeyArr.filter((item, index) => pvAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editPvLabelOrAnnotation(pvDetailInfoData.metadata.name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsPvAnnotationModalOpen(false);
            }, 1000);
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
  const handlePvAnnotationCancel = () => {
    setIsPvAnnotationModalOpen(false);
  };

  return <Fragment>
    {contextHolder}
    <div className={`resource-storge_tab_container container_margin_box ${isShow ? 'resource-storge_tooltip_container_height' : 'resource-storge_normal_container_height'}`}>
      <div className="detail_card resource-storge-detail-card" style={{ padding: '32px 32px 0 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <h3>基本信息</h3>
          <div className="resource-storge-detail_info_box">
            <div className="base_info_list">
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">名称：</p>
                  <p className="base_value">{pvDetailInfoData?.metadata?.name}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">创建时间：</p>
                  <p className="base_value">{Dayjs(pvDetailInfoData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">状态：</p>
                  <p className="base_value">{pvDetailInfoData?.status?.phase ? pvDetailInfoData.status.phase : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">回收策略：</p>
                  <p className="base_value">{pvDetailInfoData?.spec?.persistentVolumeReclaimPolicy ? pvDetailInfoData.spec.persistentVolumeReclaimPolicy : '--'}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">容量：</p>
                  <p className="base_value">{pvDetailInfoData?.spec?.capacity?.storage ? pvDetailInfoData.spec.capacity.storage : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">访问模式：</p>
                  <p className="base_value">{pvDetailInfoData?.spec?.accessModes ? pvDetailInfoData.spec.accessModes : '--'}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">存储池名称：</p>
                  <p className="base_value">{pvDetailInfoData?.spec?.storageClassName ? pvDetailInfoData.spec.storageClassName : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">绑定数据卷声明：</p>
                  <p className="base_value">{pvDetailInfoData?.spec?.claimRef?.name ? pvDetailInfoData.spec.claimRef.name : '--'}</p>
                </div>
              </div>

            </div>
            <div className="annotation">
              <div className="ann_title">
                <p className='text'>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvLabelModalOpen} type="label" dataList={pvDetailInfoData?.metadata?.labels} callbackOk={handlePvLabelOk} callbackCancel={handlePvLabelCancel} />
              <div className="key_value">
                {pvDetailInfoData.metadata?.labels?.length ?
                  pvDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p className='text'>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvAnnotationModalOpen} type="annotation" dataList={pvDetailInfoData?.metadata?.annotations} callbackOk={handlePvAnnotationOk} callbackCancel={handlePvAnnotationCancel} />
              <div className="key_value">
                {pvDetailInfoData.metadata?.annotations?.length ?
                  pvDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}