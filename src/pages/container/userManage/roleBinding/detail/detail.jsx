
/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useState, useEffect, useStore } from 'openinula';
import { EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import { Tag, message } from 'antd';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';

export default function Detail({ roleBindName, roleBindNamespace, roleBindDetailDataProps, refreshFn }) {
  const [roleBindDetailData, setRoleBindDetailData] = useState(roleBindDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();

  const [isRoleBindingDetailAnnotationModalOpen, setIsRoleBindingDetailAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(roleBindDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(roleBindDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleRoleBindDetailAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsRoleBindingDetailAnnotationModalOpen(false);
    } else {
      const roleBindingDetailAnnKeyArr = [];
      data.map(item => roleBindingDetailAnnKeyArr.push(item.key));
      if (roleBindingDetailAnnKeyArr.filter((item, index) => roleBindingDetailAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addRoleBindDetailAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('rolebinding', roleBindNamespace, roleBindName, addRoleBindDetailAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsRoleBindingDetailAnnotationModalOpen(false);
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
  const handleRoleBindDetailAnnotationCancel = () => {
    setIsRoleBindingDetailAnnotationModalOpen(false);
  };

  // 标签失败回调
  const handleRoleBindDetailLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 标签成功回调
  const handleRoleBindDetailLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const roleBindingDetailLabKeyArr = [];
      data.map(item => roleBindingDetailLabKeyArr.push(item.key));
      if (roleBindingDetailLabKeyArr.filter((item, index) => roleBindingDetailLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addRoleBindDetailLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('rolebinding', roleBindNamespace, roleBindName, addRoleBindDetailLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          }
          messageApi.error(`编辑标签失败！${error.response.data.message}`);
        }
      }
    }
  };

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card roleBindingDetail">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <div className="base_info_list">
            <div className="flex_item_opt">
              <div className="base_description">
                <p className="base_key">角色绑定名称：</p>
                <p className="base_value">{roleBindDetailData.metadata.name}</p>
              </div>
              <div className="base_description roleBindingDetail">
                <p className="base_key">命名空间：</p>
                <p className="base_value">{roleBindDetailData.metadata.namespace}</p>
              </div>
              <div className="base_description">
                <p className="base_key">绑定类型：</p>
                <p className="base_value">{'角色绑定'}</p>
              </div>
              <div className="base_description roleBingingDetail">
                <p className="base_key">创建时间：</p>
                <p className="base_value">{Dayjs(roleBindDetailData.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm')}</p>
              </div>
            </div>
          </div>
          <div className="annotation roleBingingDetail">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={roleBindDetailData.metadata?.labels} callbackOk={handleRoleBindDetailLabelOk} callbackCancel={handleRoleBindDetailLabelCancel} />
            <div className="key_value roleBingingDetail">
              {roleBindDetailData.metadata?.labels?.length ?
                roleBindDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title roleBingingDetail">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsRoleBindingDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isRoleBindingDetailAnnotationModalOpen} type="annotation" dataList={roleBindDetailData?.metadata?.annotations} callbackOk={handleRoleBindDetailAnnotationOk} callbackCancel={handleRoleBindDetailAnnotationCancel} />
            <div className="key_value">
              {roleBindDetailData.metadata?.annotations?.length ?
                roleBindDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span className='roleBingingDetail' style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}