/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Route, Switch, Redirect } from 'inula-router';
import Inula, { useStore } from 'openinula';
import { containerRouterPrefix } from '@/constant.js';

import MicroAppPage from '@/components/MicroApp';
import OverviewPage from '@/pages/container/overview';

// 应用市场
import Market from '@/pages/applicationMarket/Market';
import MarketManage from '@/pages/applicationMarket/MarketManage';
import ApplicationDetails from '@/pages/applicationMarket/ApplicationDetails';
import Deploy from '@/pages/applicationMarket/Deploy';
import OneClickDeploy from '@/pages/applicationMarket/OneClickDeploy';
import MarketCategory from '@/pages/applicationMarket/MarketCategory';
import Stash from '@/pages/container/platformManage/stash';
import StashDetails from '@/pages/container/platformManage/stash/component/StashDetails';
import PackageManagementDetail from '@/pages/applicationMarket/component/PackageManagementDetail';

// 应用管理 & 扩展组件管理
import HelmPage from '@/pages/container/applicationManage/helm/HelmIndex';
import HelmDetail from '@/pages/container/applicationManage/helm/detail/HelmDetail';
import HelmUpLevel from '@/pages/container/applicationManage/helm//HelmUpLevel';
import ExtendPage from '@/pages/container/extendManage/extend/ExtendIndex';
import ExtendUpLevel from '@/pages/container/extendManage/extend//ExtendUpLevel';
import ExtendDetail from '@/pages/container/extendManage/extend/detail/ExtendDetail';

// 工作负载
import WorkloadPage from '@/pages/container/workload/Index';
import PodDetail from '@/pages/container/workload/PodDetail';
import PodCreate from '@/pages/container/workload/PodCreate';
import DeploymentDetail from '@/pages/container/workload/DeploymentDetail';
import DeploymentCreate from '@/pages/container/workload/deployment/DeploymentCreate';
import StatefulSetDetail from '@/pages/container/workload/StatefulSetDetail';
import StatefulSetCreate from '@/pages/container/workload/statefulSet/StatefulSetCreate';
import DaemonSetDetail from '@/pages/container/workload/DaemonSetDetail';
import DaemonSetCreate from '@/pages/container/workload/daemonSet/DaemonSetCreate';
import JobDetail from '@/pages/container/workload/JobDetail';
import JobCreate from '@/pages/container/workload/job/JobCreate';
import CronJobDetail from '@/pages/container/workload/CronJobDetail';
import CronJobCreate from '@/pages/container/workload/cronJob/CronJobCreate';

// 网络
import NetworkPage from '@/pages/container/network/Index';
import ServiceDetail from '@/pages/container/network/service/ServiceDetail';
import ServiceCreate from '@/pages/container/network/service/ServiceCreate';
import IngressDetail from '@/pages/container/network/ingress/IngressDetail';
import IngressCreate from '@/pages/container/network/ingress/IngressCreate';

// 配置
import ConfigMap from '@/pages/container/configuration/configMap';
import Secret from '@/pages/container/configuration/secret';
import CreateSecret from '@/pages/container/configuration/secret/CreateSecret';
import CreateConfiguration from '@/pages/container/configuration/configMap/CreateConfiguration';
import ConfigurationDetail from '@/pages/container/configuration/configMap/ConfigurationDetail';
import ConfigurationUpdate from '@/pages/container/configuration/configMap/ConfigurationUpdate';
import SecretUpdate from '@/pages/container/configuration/secret/SecretUpdate';
import SecretDetail from '@/pages/container/configuration/secret/SecretDetail';

// 告警
import AlarmIndex from '@/pages/container/alarm/AlarmIndex';
import SilentAlarm from '@/pages/container/alarm/SilentAlarm';
import AlarmDetail from '@/pages/container/alarm/AlarmDetail';
import SilentDetail from '@/pages/container/alarm/SilentDetail';

// 监控
import MonitorHomePage from '@/pages/container/monitor/monitorDashboard/MonitorHome';
import MonitorGoalList from '@/pages/container/monitor/monitorGoalManage/MonitorGoalList';
import MonitorServiceMonitor from '@/pages/container/monitor/monitorGoalManage/MonitorServiceMonitor';
import MonitorServiceDetail from '@/pages/container/monitor/monitorGoalManage/MonitorServiceDetail';
import MonitorRuleList from '@/pages/container/monitor/monitorRuleManage/MonitorRuleList';
import MonitorRuleDetail from '@/pages/container/monitor/monitorRuleManage/MonitorRuleDetail';
import CustomizeMonitorQuery from '@/pages/container/monitor/monitorDashboard/CustomizeMonitorQuery';
import MonitorCreateService from '@/pages/container/monitor/monitorGoalManage/MonitorCreateService';

// RBAC
import ServiceAccountTab from '@/pages/container/userManage/serviceAccount/Index';
import ServiceAccountCreate from '@/pages/container/userManage/serviceAccount/ServiceAccountCreate';
import ServiceAccountDetail from '@/pages/container/userManage/serviceAccount/ServiceAccountDetail';
import RoleTab from '@/pages/container/userManage/role/Index';
import RoleDetail from '@/pages/container/userManage/role/RoleDetail';
import RoleCreate from '@/pages/container/userManage/role/RoleCreate';
import ClusterRoleDetail from '@/pages/container/userManage/role/ClusterRoleDetail';
import ClusterRoleCreate from '@/pages/container/userManage/role/ClusterRoleCreate';
import RoleBindTab from '@/pages/container/userManage/roleBinding/Index';
import RoleBindCreate from '@/pages/container/userManage/roleBinding/RoleBindCreate';
import RoleBindDetail from '@/pages/container/userManage/roleBinding/RoleBindDetail';
import ClusterRoleBindCreate from '@/pages/container/userManage/roleBinding/ClusterRoleBindCreate';
import ClusterRoleBindDetail from '@/pages/container/userManage/roleBinding/ClusterRoleBindDetail';

// 事件
import Events from '@/pages/container/event/Index';

// 管理
import NodeManagePage from '@/pages/container/platformManage/node/Index';
import NodeDetail from '@/pages/container/platformManage/node/NodeDetail';
import LimitRangePage from '@/pages/container/platformManage/limitRange/Index';
import LimitRangeCreate from '@/pages/container/platformManage/limitRange/detail/LimitRangeCreate';
import LimitRangeDetail from '@/pages/container/platformManage/limitRange/LimitRangeDetail';
import NamespacePage from '@/pages/container/platformManage/namespace/Index';
import NamespaceDetail from '@/pages/container/platformManage/namespace/NamespaceDetail';
import NamespaceCreate from '@/pages/container/platformManage/namespace/detail/NamespaceCreate';
import ResourceQuotaPage from '@/pages/container/platformManage/resourceQuota/Index';
import ResourceQuotaCreate from '@/pages/container/platformManage/resourceQuota/detail/ResourceQuotaCreate';
import ResourceQuotaDetail from '@/pages/container/platformManage/resourceQuota/ResourceQuotaDetail';
import CustomResourceDefinitionPage from '@/pages/container/platformManage/customResourceDefinition/Index';
import CustomResourceDefinitionCreate from '@/pages/container/platformManage/customResourceDefinition/detail/CustomResourceDefinitionCreate';
import CustomResourceDefinitionDetail from '@/pages/container/platformManage/customResourceDefinition/CustomResourceDefinitionDetail';
import CRDetail from '@/pages/container/platformManage/customResourceDefinition/cr/CRDetail';
import CRCreate from '@/pages/container/platformManage/customResourceDefinition/cr/CRCreate';
import ClusterUser from '@/pages/container/platformManage/clusterUser';
import ClusterMember from '@/pages/container/platformManage/clusterMember';

// 资源管理存储
import ResourcePage from '@/pages/container/resourceManage/Index';
import PvDetail from '@/pages/container/resourceManage/pv/PvDetail';
import PvcDetail from '@/pages/container/resourceManage/pvc/PvcDetail';
import ScDetail from '@/pages/container/resourceManage/sc/ScDetail';
import PvCreate from '@/pages/container/resourceManage/pv/PvCreate';
import PvcCreate from '@/pages/container/resourceManage/pvc/PvcCreate';
import ScCreate from '@/pages/container/resourceManage/sc/ScCreate';

export default function ContainerRouters() {
  const consolePluginStore = useStore('consolePlugins');

  const getPluginRoute = (item) => {
    return item.subPages ?
      item.subPages.map((sub) => (<Route
        path={`/${containerRouterPrefix}/${item.pluginName}/${sub.pageName}`}
        render={props => <MicroAppPage {...props} key={sub.pageName} subKey={window.location.pathname} name={item.pluginName} />}
      />)) :
      <Route
        path={`/${containerRouterPrefix}/${item.pluginName}`}
        render={props => <MicroAppPage {...props} key={item.pluginName} subKey={window.location.pathname} name={item.pluginName} />}
      />;
  };

  return (
    <Switch>
      {
        ...consolePluginStore.$s.consolePlugins.filter(item => item.entrypoint === `/${containerRouterPrefix}` && item.enabled)
          .map((item) => getPluginRoute(item))
      }
      <Route
        exact
        path={`/${containerRouterPrefix}/overview`}
        component={OverviewPage}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/appOverview`}
        component={Market}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/MarketManage`}
        component={MarketManage}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/:chart?/:repo?/:versionRepo?`}
        component={ApplicationDetails}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/marketCategory/Deploy/:repo?/:chart?/:versionSelect?/:defaultNameSpace?`}
        component={Deploy}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/oneClickDeploy`}
        component={OneClickDeploy}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/marketCategory/:scene?/:isFuyaoExtension?/:isCompute?`}
        component={MarketCategory}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/stash/:tabIndex?`}
        component={Stash}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/stash/wareHouse/stashDetails/:repo?`}
        component={StashDetails}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/appMarket/stash/packageManageDetails/:repo?/:chart?`}
        component={PackageManagementDetail}
      />
      <Redirect
        path={`/${containerRouterPrefix}/appMarket`}
        to={`/${containerRouterPrefix}/appMarket/appOverview`}
      />
      {/** 应用管理 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/applicationManageHelm`}
        component={HelmPage}
      />
      <Route
        path={`/${containerRouterPrefix}/applicationManageHelm/detail/:helm_namespace?/:helm_name?`}
        component={HelmDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/applicationManageHelm/upLevel/:helm_namespace?/:helm_name?`}
        component={HelmUpLevel}
      />
      {/** 拓展管理 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/extendManage`}
        component={ExtendPage}
      />
      <Route
        path={`/${containerRouterPrefix}/extendManage/upLevel/:extend_namespace?/:extend_name?`}
        component={ExtendUpLevel}
      />
      <Route
        path={`/${containerRouterPrefix}/extendManage/detail/:extend_namespace?/:extend_name?`}
        component={ExtendDetail}
      />
      {/* 配置 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/configuration/configMap`}
        component={ConfigMap}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/configMap/CreateConfiguration`}
        component={CreateConfiguration}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/configMap/ConfigurationDetail/:configurationNameSpace?/:configurationName?/:activeKey?`}
        component={ConfigurationDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/configMap/ConfigurationUpdate/:configurationNameSpace?/:configurationName?/:activeKey?`}
        component={ConfigurationUpdate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/configuration/secret`}
        component={Secret}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/secret/CreateSecret`}
        component={CreateSecret}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/secret/SecretDetail/:secretNameSpace?/:secretName?/:activeKey?`}
        component={SecretDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/configuration/secret/secretUpdate/:secretNameSpace?/:secretName?/:activeKey?`}
        component={SecretUpdate}
      />
      {/** 告警 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/alarm/alarmIndex`}
        component={AlarmIndex}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/alarm/silentAlarm`}
        component={SilentAlarm}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/alarm/alarmIndex/detail/:alarm_name?`}
        component={AlarmDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/alarm/silentAlarm/detail/:silent_name?`}
        component={SilentDetail}
      />
      {/** 工作负载 */}
      <Route
        path={`/${containerRouterPrefix}/workload/pod/detail/:podNamespace?/:podName?/:activeKey?`}
        component={PodDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/workload/pod/createPod`}
        component={PodCreate}
      />

      <Route
        path={`/${containerRouterPrefix}/workload/deployment/createDeployment`}
        component={DeploymentCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/deployment/detail/:deploymentNamespace?/:deploymentName?`}
        component={DeploymentDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/deployment/detail/:deploymentNamespace?/:deploymentName?/:activeKey?`}
        component={DeploymentDetail}
      />

      <Route
        path={`/${containerRouterPrefix}/workload/statefulSet/createStatefulSet`}
        component={StatefulSetCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/statefulSet/detail/:statefulSetName?`}
        component={StatefulSetDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/statefulSet/detail/:statefulSetNamespace?/:statefulSetName?/:activeKey?`}
        component={StatefulSetDetail}
      />

      <Route
        path={`/${containerRouterPrefix}/workload/daemonSet/createDaemonSet`}
        component={DaemonSetCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/daemonSet/detail/:daemonSetName?`}
        component={DaemonSetDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/daemonSet/detail/:daemonSetNamespace?/:daemonSetName?/:activeKey?`}
        component={DaemonSetDetail}
      />

      <Route
        path={`/${containerRouterPrefix}/workload/job/createJob`}
        component={JobCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/job/detail/:jobName?`}
        component={JobDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/job/detail/:jobNamespace?/:jobName?/:activeKey?`}
        component={JobDetail}
      />

      <Route
        path={`/${containerRouterPrefix}/workload/cronJob/createCronJob`}
        component={CronJobCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/cronJob/detail/:cronJobName?`}
        component={CronJobDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/workload/cronJob/detail/:cronJobNamespace?/:cronJobName?/:activeKey?`}
        component={CronJobDetail}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/workload/:activeTabKey`}
        component={WorkloadPage}
      />
      <Redirect
        path={`/${containerRouterPrefix}/workload`}
        to={`/${containerRouterPrefix}/workload/pod`}
      />
      {/** 事件 */}
      <Route
        path={`/${containerRouterPrefix}/event`}
        component={Events}
      />
      {/** 管理 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/nodeManage`}
        component={NodeManagePage}
      />
      <Route
        path={`/${containerRouterPrefix}/nodeManage/detail/:nodeName?`}
        component={NodeDetail}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/namespace/namespaceManage`}
        component={NamespacePage}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/namespaceManage/createNamespace`}
        component={NamespaceCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/namespaceManage/detail/:namespaceName?/:activeKey?`}
        component={NamespaceDetail}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/namespace/limitRange`}
        component={LimitRangePage}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/limitRange/createLimitRange`}
        component={LimitRangeCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/limitRange/detail/:limitNamespace?/:limitName?/:activeKey?`}
        component={LimitRangeDetail}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/namespace/resourceQuota`}
        component={ResourceQuotaPage}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/resourceQuota/createResourceQuota`}
        component={ResourceQuotaCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/namespace/resourceQuota/detail/:resourceQuotaNamespace?/:resourceQuotaName?/:activeKey?`}
        component={ResourceQuotaDetail}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/customResourceDefinition`}
        component={CustomResourceDefinitionPage}
      />
      <Route
        path={`/${containerRouterPrefix}/customResourceDefinition/createCustomResourceDefinition`}
        component={CustomResourceDefinitionCreate}
      />

      <Route
        exact
        path={`/${containerRouterPrefix}/customResourceDefinition/detail/:customResourceName?/createCR`}
        component={CRCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/customResourceDefinition/detail/:customResourceName?/crDetail/:exampleName?/:activeKey?`}
        component={CRDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/customResourceDefinition/detail/:customResourceName?/:activeKey?`}
        component={CustomResourceDefinitionDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/platformManage/packageManageDetails/:repo?/:chart?`}
        component={PackageManagementDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/clusterUser`}
        component={ClusterUser}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/clusterMember`}
        component={ClusterMember}
      />

      {/** CR */}
      <Route
        exact
        path={`/${containerRouterPrefix}/platformManage/customResourceDefinition/detail/:customResourceName?/:activeKey?/createCR`}
        component={CRCreate}
      />

      {/** 网络 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/network/:activeTabKey`}
        component={NetworkPage}
      />
      <Route
        path={`/${containerRouterPrefix}/network/service/createService`}
        component={ServiceCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/network/ingress/createIngress`}
        component={IngressCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/network/service/ServiceDetail/:service_namespace?/:service_name?/:activeKey?`}
        component={ServiceDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/network/ingress/IngressDetail/:ingress_namespace?/:ingress_name?/:activeKey?`}
        component={IngressDetail}
      />
      <Redirect
        path={`/${containerRouterPrefix}/network`}
        to={`/${containerRouterPrefix}/network/service`}
      />

      {/** 资源管理存储 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/resourceManagement/:activeTabKey`}
        component={ResourcePage}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/pv/createPv`}
        component={PvCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/pvc/createPvc`}
        component={PvcCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/sc/createSc`}
        component={ScCreate}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/pv/PvDetail/:pvName?/:activeKey?`}
        component={PvDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/pvc/PvcDetail/:pvcNamespace?/:pvcName?/:activeKey?`}
        component={PvcDetail}
      />
      <Route
        path={`/${containerRouterPrefix}/resourceManagement/sc/ScDetail/:scName?/:activeKey?`}
        component={ScDetail}
      />
      <Redirect
        path={`/${containerRouterPrefix}/resourceManagement`}
        to={`/${containerRouterPrefix}/resourceManagement/pv`}
      />

      {/** 监控 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorDashboard`}
        component={MonitorHomePage}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorDashboard/customize/query`}
        component={CustomizeMonitorQuery}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorGoalManage`}
        component={MonitorGoalList}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor`}
        component={MonitorServiceMonitor}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/create`}
        component={MonitorCreateService}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/detail/:namespace?/:exampleName?/:activeKey?`}
        component={MonitorServiceDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorRuleManage`}
        component={MonitorRuleList}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/monitor/monitorRuleManage/detail/:name?`}
        component={MonitorRuleDetail}
      />

      <Redirect
        path={`/${containerRouterPrefix}/monitor`}
        to={`/${containerRouterPrefix}/monitor/monitorDashboard`}
      />
      {/** 服务账号 */}
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/serviceAccount`}
        component={ServiceAccountTab}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/serviceAccount/createServiceAccount`}
        component={ServiceAccountCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/serviceAccount/detail/:serviceAccountNamespace?/:serviceAccountName?/:activeKey?`}
        component={ServiceAccountDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/role`}
        component={RoleTab}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/role/createRole`}
        component={RoleCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/role/createClusterRole`}
        component={ClusterRoleCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/role/detail/:activeKey?`}
        component={RoleDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/clusterRole/:activeKey?`}
        component={ClusterRoleDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/roleBinding`}
        component={RoleBindTab}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/roleBinding/createRoleBind`}
        component={RoleBindCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/roleBinding/createClusterRoleBind`}
        component={ClusterRoleBindCreate}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/roleBinding/detail/:roleBindNamespace?/:roleBindName?/:activeKey?`}
        component={RoleBindDetail}
      />
      <Route
        exact
        path={`/${containerRouterPrefix}/userManage/clusterRoleBinding/detail/:roleBindName?/:activeKey?`}
        component={ClusterRoleBindDetail}
      />
      <Redirect to={`/${containerRouterPrefix}/overview`} />
    </Switch>
  );
}
