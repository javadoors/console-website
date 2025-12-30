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
import { editScLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import '@/styles/pages/resourceManage.less';

export default function Detail({ scDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [scDetailInfoData, setScDetailData] = useState(scDetailDataProps); // 详情数据

  const [oldAnnotations, setOldAnnotations] = useState(scDetailDataProps.metadata.annotations); // 未修改前注解

  const [oldLabels, setOldLabels] = useState(scDetailDataProps.metadata.labels);

  // 标签对话框展示
  const [isScLabelModalOpen, setIsScLabelModalOpen] = useState(false);
  // 注解对话框展示
  const [isScAnnotationModalOpen, setIsScAnnotationModalOpen] = useState(false);

  const themeStore = useStore('theme');

  // 标签成功回调
  const handleScLabelOk = async (data) => {
    const scLabKeyArr = [];
    data.map(item => scLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsScLabelModalOpen(false);
    } else {
      if (scLabKeyArr.filter((item, index) => scLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addScLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editScLabelOrAnnotation(scDetailInfoData.metadata.name, addScLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsScLabelModalOpen(false);
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
  const handleScLabelCancel = () => {
    setIsScLabelModalOpen(false);
  };

  // 注解成功回调
  const handleScAnnotationOk = async (data) => {
    const scAnnKeyArr = [];
    data.map(item => scAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsScAnnotationModalOpen(false);
    } else {
      if (scAnnKeyArr.filter((item, index) => scAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addScAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editScLabelOrAnnotation(scDetailInfoData.metadata.name, addScAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsScAnnotationModalOpen(false);
            }, 1000);
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
  const handleScAnnotationCancel = () => {
    setIsScAnnotationModalOpen(false);
  };

  const getScVolumeExpansionData = (type) => {
    let backType = '--';
    switch (type) {
      case true:
        backType = '是';
        break;
      case false:
        backType = '否';
        break;
      default:
        backType = '--';
        break;
    }
    return backType;
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
                  <p className="base_value">{scDetailInfoData?.metadata?.name}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">创建时间：</p>
                  <p className="base_value">{Dayjs(scDetailInfoData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">回收策略：</p>
                  <p className="base_value">{scDetailInfoData?.reclaimPolicy ? scDetailInfoData?.reclaimPolicy : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">卷绑定模式：</p>
                  <p className="base_value">{scDetailInfoData?.volumeBindingMode ? scDetailInfoData?.volumeBindingMode : '--'}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className="base_description">
                  <p className="base_key">存储提供者：</p>
                  <p className="base_value">{scDetailInfoData?.provisioner ? scDetailInfoData.provisioner : '--'}</p>
                </div>
                <div className="base_description">
                  <p className="base_key">是否允许卷扩展：</p>
                  <p className="base_value">{scDetailInfoData?.allowVolumeExpansion ? getScVolumeExpansionData(scDetailInfoData.allowVolumeExpansion) : '--'}</p>
                </div>
              </div>
            </div>

            <div className="annotation">
              <div className="ann_title">
                <p className='text'>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsScLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isScLabelModalOpen} type="label" dataList={scDetailInfoData?.metadata?.labels} callbackOk={handleScLabelOk} callbackCancel={handleScLabelCancel} />
              <div className="key_value">
                {scDetailInfoData.metadata?.labels?.length ?
                  scDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p className='text'>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsScAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isScAnnotationModalOpen} type="annotation" dataList={scDetailInfoData?.metadata?.annotations} callbackOk={handleScAnnotationOk} callbackCancel={handleScAnnotationCancel} />
              <div className="key_value">
                {scDetailInfoData.metadata?.annotations?.length ?
                  scDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}