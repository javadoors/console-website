/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:

 *       http://license.coscl.org.cn/MulanPSL2

 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import { Fragment, useState, useStore } from 'openinula';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import { useHistory } from 'inula-router';
import { CloseCircleFilled, CheckCircleFilled, LoadingOutlined, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { message } from 'antd';
import { filterManageState } from '@/utils/common';
import '@/styles/pages/helm.less';

export default function HelmDetailInfor({ helmName, helmDetailDataProps }) {
  const history = useHistory();

  const [helmDetailData, setHelmDetailData] = useState(helmDetailDataProps); // 详情数据

  const [messageApi, contextHolder] = message.useMessage();

  const [infoName, setInfoName] = useState(helmName);

  const themeStore = useStore('theme');

  // 状态图标判断  
  const helmStateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className="helm_state_successful" style={{ marginRight: '8px' }} />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className="helm_state_failed" style={{ marginRight: '8px' }} />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className="helm_state_unknown" style={{ marginRight: '8px' }} />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className="helm_state_unknown" />;
    } else {
      return <LoadingOutlined className="helm_state_pending" style={{ marginRight: '8px' }} />;
    }
  };

  const goAppMarket = () => {
    if (helmDetailData.labels['openfuyao.io.repo']) {
      history.push(`/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/${helmDetailData.chart.metadata.name}/${helmDetailData.labels['openfuyao.io.repo']}/${helmDetailData.chart.metadata.version}`);
    } else {
      messageApi.info('安装来源非openFuyao应用市场', 5);
    }
  };

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`helm_tab_container container_margin_box`}>
      <div className="basic_info_card">
        <h3 className="box_title_h3">基本信息</h3>
        <div className="basic_info_card_box">
          <div className="basic_helm_info_card_box_list">
            <div className="basic_info_card_box_list_group">
              <div className="base_description">
                <p className="base_key">应用名称：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{infoName}</p>
              </div>
              <div className="base_description">
                <p className="base_key">命名空间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{helmDetailData.namespace}</p>
              </div>
            </div>
            <div className="basic_info_card_box_list_group">
              <div className="base_description">
                <p className="base_key">状态：</p>
                <div className='base_helm_status_box'>
                  <div className="base_value" style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: themeStore.$s.theme !== 'light' && '#fff',
                  }}>{helmStateIconFilter(filterManageState(helmDetailData.info.status))}{filterManageState(helmDetailData.info.status)}</div>
                </div>
              </div>
              <div className="base_description">
                <p className="base_key">应用模板：</p>
                <p
                  onClick={goAppMarket}
                  className='base_jump_value'>{helmDetailData.chart?.metadata?.name ? helmDetailData.chart.metadata.name : '--'}</p>
              </div>
            </div>
            <div className="basic_info_card_box_list_group">
              <div className="base_description">
                <p className="base_key">应用版本：</p>
                <p
                  className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{helmDetailData.chart?.metadata?.appVersion ? helmDetailData.chart.metadata.appVersion : '--'}</p>
              </div>
              <div className="base_description">
                <p className="base_key">模板版本：</p>
                <p
                  className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{helmDetailData.chart?.metadata?.version ? helmDetailData.chart.metadata.version : '--'}</p>
              </div>
            </div>
            <div className="basic_info_card_box_list_group">
              <div className="base_description">
                <p className="base_key">创建时间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{Dayjs(helmDetailData.info.firstDeployed).format('YYYY-MM-DD HH:mm')}</p>
              </div>
              <div className="base_description">
                <p className="base_key">更新时间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{Dayjs(helmDetailData.info.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </Fragment>;
}