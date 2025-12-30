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
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import { Tabs } from 'antd';
import { useState, useEffect } from 'openinula';
import PvTab from '@/pages/container/resourceManage/PvTab';
import PvcTab from '@/pages/container/resourceManage/PvcTab';
import ScTab from '@/pages/container/resourceManage/ScTab';
import '@/styles/pages/resourceManage.less';
import { useParams } from 'inula-router';

export default function resourceManagePage() {
  const { activeTabKey } = useParams();

  const [pageElement, setPageElement] = useState();

  useEffect(() => {
    let element = <></>; // 渲染节点
    switch (activeTabKey) {
      case 'pv': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '存储', path: `/${containerRouterPrefix}/resourceManagement/pv`, disabled: true }, { title: '数据卷(PV)', path: '/' }]} />
          <PvTab />
        </>;
        break;
      }
      case 'pvc': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '存储', path: `/${containerRouterPrefix}/resourceManagement/pvc` }, { title: '数据卷声明(PVC)', path: '/' }]} />
          <PvcTab />
        </>;
        break;
      }
      case 'sc': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '存储', path: `/${containerRouterPrefix}/resourceManagement/sc` }, { title: '存储池(SC)', path: '/' }]} />
          <ScTab />
        </>;
        break;
      }
      default: {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '存储', path: `/${containerRouterPrefix}/resourceManagement/pv` }, { title: '数据卷(PV)', path: '/' }]} />
          <PvTab />
        </>;
      }
    }
    setPageElement(element);
  }, [activeTabKey]);

  return <div className={activeTabKey === 'pvc' ? 'child_content withBread_content' : 'child_content'}>
    {pageElement}
  </div>;
}