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
import { editPvcLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import '@/styles/pages/resourceManage.less';

export default function Detail({ pvcDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);

  const [messageApi, contextHolder] = message.useMessage();

  const [pvcDetailInfoData, setPvcDetailData] = useState(pvcDetailDataProps); // 详情数据

  const [oldAnnotations, setOldAnnotations] = useState(pvcDetailDataProps.metadata.annotations); // 未修改前注解

  const [oldLabels, setOldLabels] = useState(pvcDetailDataProps.metadata.labels);

  // 标签对话框展示
  const [isPvcLabelModalOpen, setIsPvcLabelModalOpen] = useState(false);
  // 注解对话框展示
  const [isPvcAnnotationModalOpen, setIsPvcAnnotationModalOpen] = useState(false);

  const themeStore = useStore('theme');

  // 标签成功回调
  const handlePvcLabelOk = async (data) => {
    const pvcLabKeyArr = [];
    data.map(item => pvcLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsPvcLabelModalOpen(false);
    } else {
      if (pvcLabKeyArr.filter((item, index) => pvcLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addPvcLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editPvcLabelOrAnnotation(pvcDetailInfoData.metadata.namespace, pvcDetailInfoData.metadata.name, addPvcLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsPvcLabelModalOpen(false);
            }, 1000);
          }
        } catch (pvce) {
          if (pvce.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, pvce);
          } else {
            messageApi.error(`编辑标签失败！${pvce.response.data.message}`);
          }
        }
      }
    }
  };

  // 标签失败回调
  const handlePvcLabelCancel = () => {
    setIsPvcLabelModalOpen(false);
  };

  // 注解成功回调
  const handlePvcAnnotationOk = async (data) => {
    const pvcAnnKeyArr = [];
    data.map(item => pvcAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsPvcAnnotationModalOpen(false);
    } else {
      if (pvcAnnKeyArr.filter((item, index) => pvcAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addPvcAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editPvcLabelOrAnnotation(pvcDetailInfoData.metadata.namespace, pvcDetailInfoData.metadata.name, addPvcAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsPvcAnnotationModalOpen(false);
            }, 1000);
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
  const handlePvcAnnotationCancel = () => {
    setIsPvcAnnotationModalOpen(false);
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
                  <p className="base_value">{pvcDetailInfoData?.metadata?.name}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">创建时间：</p>
                  <p className="base_value">{Dayjs(pvcDetailInfoData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">状态：</p>
                  <p className="base_value">{pvcDetailInfoData?.status?.phase ? pvcDetailInfoData.status.phase : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">命名空间：</p>
                  <p className="base_value">{pvcDetailInfoData?.metadata?.namespace}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">容量：</p>
                  <p className="base_value">{pvcDetailInfoData?.spec?.resources?.requests?.storage ? pvcDetailInfoData.spec.resources.requests.storage : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">访问模式：</p>
                  <p className="base_value">{pvcDetailInfoData?.spec?.accessModes ? pvcDetailInfoData.spec.accessModes : '--'}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">关联存储池：</p>
                  <p className="base_value">{pvcDetailInfoData?.spec?.storageClassName ? pvcDetailInfoData.spec.storageClassName : '--'}</p>
                </div>
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p className='text'>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvcLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvcLabelModalOpen} type="label" dataList={pvcDetailInfoData?.metadata?.labels} callbackOk={handlePvcLabelOk} callbackCancel={handlePvcLabelCancel} />
              <div className="key_value">
                {pvcDetailInfoData.metadata?.labels?.length ?
                  pvcDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p className='text'>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvcAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvcAnnotationModalOpen} type="annotation" dataList={pvcDetailInfoData?.metadata?.annotations} callbackOk={handlePvcAnnotationOk} callbackCancel={handlePvcAnnotationCancel} />
              <div className="key_value">
                {pvcDetailInfoData.metadata?.annotations?.length ?
                  pvcDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}