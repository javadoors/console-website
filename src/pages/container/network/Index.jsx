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
import ServiceTab from '@/pages/container/network/ServiceTab';
import IngressTab from '@/pages/container/network/IngressTab';
import '@/styles/pages/network.less';
import { useParams } from 'inula-router';

export default function networkPage() {
  const { activeTabKey } = useParams();

  const [pageElement, setPageElement] = useState();

  useEffect(() => {
    let element = <></>; // 渲染节点
    switch (activeTabKey) {
      case 'service': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '网络', path: `/${containerRouterPrefix}/network/service`, disabled: true }, { title: 'Service', path: '/' }]} />
          <ServiceTab />
        </>;
        break;
      }
      case 'ingress': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '网络', path: `/${containerRouterPrefix}/network/ingress` }, { title: 'Ingress', path: '/' }]} />
          <IngressTab />
        </>;
        break;
      }
      default: {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '网络', path: `/${containerRouterPrefix}/network/service` }, { title: 'Service', path: '/' }]} />
          <ServiceTab />
        </>;
      }
    }
    setPageElement(element);
  }, [activeTabKey]);

  return <div className="child_content withBread_content">
    {pageElement}
  </div>;
}