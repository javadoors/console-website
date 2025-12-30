/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import PodTab from '@/pages/container/workload/PodTab';
import DeploymentTab from '@/pages/container/workload/DeploymentTab';
import StatefulSetTab from '@/pages/container/workload/StatefulSetTab';
import DaemonSetTab from '@/pages/container/workload/DaemonSetTab';
import JobTab from '@/pages/container/workload/JobTab';
import CronJobTab from '@/pages/container/workload/CronJobTab';
import '@/styles/pages/workload.less';
import { useParams } from 'inula-router';
import { useEffect, useState } from 'openinula';

export default function WorkloadPage() {
  const { activeTabKey } = useParams();

  const [pageElement, setPageElement] = useState();

  useEffect(() => {
    let element = <></>; // 渲染节点
    switch (activeTabKey) {
      case 'pod': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/pod`, disabled: true }, { title: 'Pod', path: '/' }]} />
          <PodTab />
        </>;
        break;
      }
      case 'deployment': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/deployment`, disabled: true }, { title: 'Deployment', path: '/' }]} />
          <DeploymentTab />
        </>;
        break;
      }
      case 'statefulSet': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/statefulSet`, disabled: true }, { title: 'StatefulSet', path: '/' }]} />
          <StatefulSetTab />
        </>;
        break;
      }
      case 'daemonSet': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/daemonSet`, disabled: true }, { title: 'DaemonSet', path: '/' }]} />
          <DaemonSetTab />
        </>;
        break;
      }
      case 'job': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/job`, disabled: true }, { title: 'Job', path: '/' }]} />
          <JobTab />
        </>;
        break;
      }
      case 'cronJob': {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/cronJob`, disabled: true }, { title: 'CronJob', path: '/' }]} />
          <CronJobTab />
        </>;
        break;
      }
      default: {
        element = <>
          <BreadCrumbCom className="create_bread" items={[{ title: '工作负载', path: `/${containerRouterPrefix}/workload/pod`, disabled: true }, { title: 'Pod', path: '/' }]} />
          <PodTab />
        </>;
      }
    }
    setPageElement(element);
  }, [activeTabKey]);

  return <div className="child_content withBread_content">
    {pageElement}
  </div>;
}