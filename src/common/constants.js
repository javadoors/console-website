/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const ResponseCode = {
  OK: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  Found: 302,
  BadRequest: 400,
  UnAuthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  InternalServerError: 500,
  BadGateway: 502,
  GatewayTimeout: 504,
};

export const workloadFilterOptions = ['pending', 'running', 'succeeded', 'failed', 'unknown'];

export const podContainerOptions = ['Waiting', 'Running', 'Terminated', 'Unknown'];
// 节点状态
export const nodeStatusOptions = {
  normal: '正常',
  failed: '异常',
};

// 节点类型
export const nodeTypeOptions = {
  workerNode: '工作节点',
  manageNode: '管理节点',
};

export const namespaceStatusOptions = {
  active: 'Active',
  terminating: 'Terminating',
};

// helm状态
export const manageStatusFilterOptions = ['部署成功', '部署失败', '处理中', '卸载中'];

// helm turbo
export const manageTurboFilterOptions = ['true', 'false'];

export const ReleaseStatus = {
  Current: '运行中',
  Failed: '失败',
  InProgress: '创建中',
  Terminating: '删除中',
};

// deployment状态
export const deploymentStatus = {
  Active: 'active',
  Updating: 'updating',
  Failed: 'failed',
};

// job
export const jobStatus = {
  Complete: 'complete',
  Active: 'active',
  Failed: 'failed',
};

// cronJob
export const cronJobStatus = {
  Completed: 'completed',
  Active: 'active',
};

export const timePeriodOptions = [
  {
    label: '近10分钟',
    value: '10m',
  },
  {
    label: '近30分钟',
    value: '30m',
  },
  {
    label: '近1小时',
    value: '1h',
  },
  {
    label: '近3小时',
    value: '3h',
  },
  {
    label: '近6小时',
    value: '6h',
  },
  {
    label: '近1天',
    value: '1d',
  },
  {
    label: '近3天',
    value: '3d',
  },
  {
    label: '近7天',
    value: '7d',
  },
  {
    label: '近14天',
    value: '14d',
  },
];

export const refreshTimeOptions = [
  {
    label: '不自动刷新',
    value: 0,
  },
  {
    label: '刷新间隔 15秒',
    value: 15,
  },
  {
    label: '刷新间隔 30秒',
    value: 30,
  },
  {
    label: '刷新间隔 1分钟',
    value: 60,
  },
  {
    label: '刷新间隔 5分钟',
    value: 300,
  },
  {
    label: '刷新间隔 1天',
    value: 86400,
  },
];

export const controllMonitorOptions = [
  {
    label: 'ETCD',
    value: 'etcd',
  },
  {
    label: 'kube-apiserver',
    value: 'kube-apiserver',
  },
  {
    label: 'kube-scheduler',
    value: 'kube-scheduler',
  },
  {
    label: 'kube-controller-manager',
    value: 'kube-controller-manager',
  },
];

export const nodeMonitorOptions = [
  {
    label: 'kubelet',
    value: 'kubelet',
  },
  {
    label: 'kube-proxy',
    value: 'kube-proxy',
  },
];

export const typeOptions = [
  {
    label: 'deployment',
    value: 'deployment',
  },
  {
    label: 'StatefulSet',
    value: 'statefulset',
  },
  {
    label: 'DaemonSet',
    value: 'daemonset',
  },
];

export const monitorGoalFilterOptions = [
  {
    label: 'up',
    value: 'up',
  },
  {
    label: 'down',
    value: 'down',
  },
  {
    label: 'unknown',
    value: 'unknown',
  },
];

export const alarmStatusOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '未触发(inactive)',
    value: 'inactive',
  },
  {
    label: '待定(pending)',
    value: 'pending',
  },
  {
    label: '触发(firing)',
    value: 'firing',
  },
];

export const alarmLevelOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '严重',
    value: 'critical',
  },
  {
    label: '提示',
    value: 'info',
  },
  {
    label: '警告',
    value: 'warning',
  },
];


export const alarmStatusEx = {
  inactive: '未触发',
  firing: '触发',
  pending: '待定',
};

export const alarmLevelEx = {
  critical: '严重',
  info: '提示',
  warning: '警告',
};

export const stepList = {
  '10m': '2s',
  '30m': '6s',
  '1h': '14s',
  '3h': '72s',
  '6h': '86s',
  '1d': '345s',
  '3d': '1035s',
  '7d': '2419s',
  '14d': '4838s',
}; // 基于prometheus 5min-1s

export const disabledModifyMonitorServiceCr = [
  'alertmanager-main',
  'blackbox-exporter',
  'coredns', 'etcd',
  'kube-apiserver',
  'kube-controller-manager',
  'kube-proxy',
  'kube-scheduler',
  'kube-state-metrics',
  'kubelet',
  'node-exporter',
  'prometheus-k8s',
  'prometheus-operator',
]; // 禁止修改的serviceminitor实例

export const eventLevelOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '警告',
    value: 'Warning',
  },
  {
    label: '正常',
    value: 'Normal',
  },
];

export const silentOptions = [
  { label: '分', value: 'm' },
  { label: '时', value: 'h' },
  { label: '天', value: 'd' },
];
// 终端类型
export const terminalType = {
  cluster: '集群',
  container: '容器',
};

export const docAddress = [
  {
    path: '/container_platform/overview',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E6%80%BB%E8%A7%88',
  },
  {
    path: '/container_platform/appMarket/appOverview',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%BA%94%E7%94%A8%E5%B8%82%E5%9C%BA/#%E6%A6%82%E8%A7%88',
  },
  {
    path: '/container_platform/appMarket/marketCategory',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%BA%94%E7%94%A8%E5%B8%82%E5%9C%BA#%E4%BD%BF%E7%94%A8%E5%BA%94%E7%94%A8%E5%88%97%E8%A1%A8',
  },
  {
    path: '/container_platform/appMarket/stash',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%BA%94%E7%94%A8%E5%B8%82%E5%9C%BA#%E4%BD%BF%E7%94%A8%E4%BB%93%E5%BA%93%E9%85%8D%E7%BD%AE',
  },
  {
    path: '/container_platform/applicationManageHelm',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%BA%94%E7%94%A8%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/extendManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E6%89%A9%E5%B1%95%E7%BB%84%E4%BB%B6%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/workload/pod',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD',
  },
  {
    path: '/container_platform/workload/deployment',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD#%E5%90%8E%E7%BB%AD%E6%93%8D%E4%BD%9C',
  },
  {
    path: '/container_platform/workload/statefulSet',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD#%E5%90%8E%E7%BB%AD%E6%93%8D%E4%BD%9C',
  },
  {
    path: '/container_platform/workload/daemonSet',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD#%E5%90%8E%E7%BB%AD%E6%93%8D%E4%BD%9C',
  },
  {
    path: '/container_platform/workload/job',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD#%E5%90%8E%E7%BB%AD%E6%93%8D%E4%BD%9C',
  },
  {
    path: '/container_platform/workload/cronJob',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD#%E5%90%8E%E7%BB%AD%E6%93%8D%E4%BD%9C',
  },
  {
    path: '/container_platform/network/service',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%BD%91%E7%BB%9C#%E4%BD%BF%E7%94%A8service',
  },
  {
    path: '/container_platform/network/ingress',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%BD%91%E7%BB%9C#%E4%BD%BF%E7%94%A8ingress',
  },
  {
    path: '/container_platform/resourceManagement/pv',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%AD%98%E5%82%A8#%E4%BD%BF%E7%94%A8pv',
  },
  {
    path: '/container_platform/resourceManagement/pvc',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%AD%98%E5%82%A8#%E4%BD%BF%E7%94%A8pvc',
  },
  {
    path: '/container_platform/resourceManagement/sc',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%AD%98%E5%82%A8#%E4%BD%BF%E7%94%A8sc',
  },
  {
    path: '/container_platform/nodeManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E8%8A%82%E7%82%B9',
  },
  {
    path: '/container_platform/configuration/configMap',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E9%85%8D%E7%BD%AE%E4%B8%8E%E5%AF%86%E9%92%A5#%E4%BD%BF%E7%94%A8configmap',
  },
  {
    path: '/container_platform/configuration/secret',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E9%85%8D%E7%BD%AE%E4%B8%8E%E5%AF%86%E9%92%A5#%E4%BD%BF%E7%94%A8secret',
  },
  {
    path: '/container_platform/namespace/namespaceManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4#%E4%BD%BF%E7%94%A8%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4',
  },
  {
    path: '/container_platform/namespace/limitRange',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4#%E4%BD%BF%E7%94%A8%E9%99%90%E5%88%B6%E8%8C%83%E5%9B%B4',
  },
  {
    path: '/container_platform/namespace/resourceQuota',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4#%E4%BD%BF%E7%94%A8%E8%B5%84%E6%BA%90%E9%85%8D%E9%A2%9D',
  },
  {
    path: '/container_platform/customResourceDefinition',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%B5%84%E6%BA%90',
  },
  {
    path: '/container_platform/computing-power-engine/computingOverview',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%AE%97%E5%8A%9B%E5%BC%95%E6%93%8E#%E6%A6%82%E8%A7%88',
  },
  {
    path: '/container_platform/computing-power-engine/console',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%AE%97%E5%8A%9B%E5%BC%95%E6%93%8E#%E4%BD%BF%E7%94%A8%E6%8E%A7%E5%88%B6%E5%8F%B0',
  },
  {
    path: '/container_platform/computing-power-engine/sceneManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%AE%97%E5%8A%9B%E5%BC%95%E6%93%8E#%E5%9C%BA%E6%99%AF%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/computing-power-engine/pluginManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%AE%97%E5%8A%9B%E5%BC%95%E6%93%8E#%E6%8F%92%E4%BB%B6%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/computing-power-engine/tuningReport',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%AE%97%E5%8A%9B%E5%BC%95%E6%93%8E#%E8%B0%83%E4%BC%98%E6%8A%A5%E5%91%8A',
  },
  {
    path: '/container_platform/colocation/ColocationOverview',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%9C%A8%E7%A6%BB%E7%BA%BF%E6%B7%B7%E9%83%A8#%E6%A6%82%E8%A7%88',
  },
  {
    path: '/container_platform/colocation/ColocationNodeManagement',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%9C%A8%E7%A6%BB%E7%BA%BF%E6%B7%B7%E9%83%A8#%E4%BD%BF%E7%94%A8%E8%8A%82%E7%82%B9%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/colocation/ColocationWorkloadManagement',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%9C%A8%E7%A6%BB%E7%BA%BF%E6%B7%B7%E9%83%A8#%E4%BD%BF%E7%94%A8%E6%B7%B7%E9%83%A8%E5%B7%A5%E4%BD%9C%E8%B4%9F%E8%BD%BD%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/colocation/ColocationRulesManagement',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%9C%A8%E7%A6%BB%E7%BA%BF%E6%B7%B7%E9%83%A8#%E4%BD%BF%E7%94%A8%E6%B7%B7%E9%83%A8%E8%A7%84%E5%88%99%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/scheduling/NumaOverview',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/NUMA%E4%BA%B2%E5%92%8C%E8%B0%83%E5%BA%A6#%E6%9F%A5%E7%9C%8B%E6%A6%82%E8%A7%88%E9%A1%B5',
  },
  {
    path: '/container_platform/scheduling/AffinityPolicyConfiguration',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/NUMA%E4%BA%B2%E5%92%8C%E8%B0%83%E5%BA%A6#%E4%BD%BF%E7%94%A8%E4%BA%B2%E5%92%8C%E7%AD%96%E7%95%A5%E9%85%8D%E7%BD%AE',
  },
  {
    path: '/container_platform/scheduling/numaMonitor',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/NUMA%E4%BA%B2%E5%92%8C%E8%B0%83%E5%BA%A6#%E4%BD%BF%E7%94%A8%E9%9B%86%E7%BE%A4numa%E7%9B%91%E6%8E%A7',
  },
  {
    path: '/container_platform/monitor/monitorDashboard',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%9B%91%E6%8E%A7#%E4%BD%BF%E7%94%A8%E7%9B%91%E6%8E%A7%E7%9C%8B%E6%9D%BF',
  },
  {
    path: '/container_platform/monitor/monitorGoalManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%9B%91%E6%8E%A7#%E4%BD%BF%E7%94%A8%E7%9B%91%E6%8E%A7%E7%9B%AE%E6%A0%87',
  },
  {
    path: '/container_platform/monitor/monitorRuleManage',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%9B%91%E6%8E%A7#%E4%BD%BF%E7%94%A8%E7%9B%91%E6%8E%A7%E7%9B%AE%E6%A0%87',
  },
  {
    path: '/container_platform/monitoring-dashboard/dashboard',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E8%87%AA%E5%AE%9A%E4%B9%89%E7%9B%91%E6%8E%A7%E7%9C%8B%E6%9D%BF',
  },
  {
    path: '/container_platform/logging/logSearch',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E6%97%A5%E5%BF%97#%E4%BD%BF%E7%94%A8%E6%97%A5%E5%BF%97%E6%9F%A5%E8%AF%A2',
  },
  {
    path: '/container_platform/logging/logSet',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E6%97%A5%E5%BF%97#%E4%BD%BF%E7%94%A8%E6%97%A5%E5%BF%97%E8%AE%BE%E7%BD%AE',
  },
  {
    path: '/container_platform/alarm/alarmIndex',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%91%8A%E8%AD%A6#%E4%BD%BF%E7%94%A8%E5%BD%93%E5%89%8D%E5%91%8A%E8%AD%A6',
  },
  {
    path: '/container_platform/alarm/silentAlarm',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%91%8A%E8%AD%A6#%E4%BD%BF%E7%94%A8%E9%9D%99%E9%BB%98%E5%91%8A%E8%AD%A6',
  },
  {
    path: '/container_platform/event',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E4%BA%8B%E4%BB%B6',
  },
  {
    path: '/container_platform/clusterUser',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86#%E5%88%86%E9%85%8D%E9%9B%86%E7%BE%A4%E8%A7%92%E8%89%B2',
  },
  {
    path: '/container_platform/clusterMember',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86#%E6%9F%A5%E7%9C%8B%E9%9B%86%E7%BE%A4%E6%88%90%E5%91%98',
  },
  {
    path: '/container_platform/userManage/serviceAccount',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/RBAC%E7%AE%A1%E7%90%86#%E6%9F%A5%E7%9C%8B%E6%9C%8D%E5%8A%A1%E8%B4%A6%E5%8F%B7',
  },
  {
    path: '/container_platform/userManage/role',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/RBAC%E7%AE%A1%E7%90%86#%E4%BD%BF%E7%94%A8%E8%A7%92%E8%89%B2%E7%AE%A1%E7%90%86',
  },
  {
    path: '/container_platform/userManage/roleBinding',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/RBAC%E7%AE%A1%E7%90%86#%E4%BD%BF%E7%94%A8%E8%A7%92%E8%89%B2%E7%BB%91%E5%AE%9A',
  },
  {
    path: '/multicluster',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E5%A4%9A%E9%9B%86%E7%BE%A4%E7%AE%A1%E7%90%86',
  },
  {
    path: '/user_manage/user',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86#%E6%9F%A5%E7%9C%8B%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF',
  },
  {
    path: '/user_manage/role',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86#%E6%9F%A5%E7%9C%8B%E5%B9%B3%E5%8F%B0%E7%BA%A7%E8%A7%92%E8%89%B2%E5%88%97%E8%A1%A8',
  },
  {
    path: '/setting/userinfo',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86#%E4%BD%BF%E7%94%A8%E7%94%A8%E6%88%B7%E8%A7%86%E8%A7%92%E7%9A%84%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86',
  },
  {
    path: '/ai-copilot',
    address: 'https://docs.openfuyao.com/docs/%E7%94%A8%E6%88%B7%E6%8C%87%E5%8D%97/AI%E5%BC%80%E7%AE%B1%E5%8D%B3%E7%94%A8',
  },
];
// 终端ws前缀
export function getWsPrefix() {
  let clusterName = sessionStorage.getItem('cluster');
  let paramObj = {
    terminalUrl: `/clusters/${clusterName}/rest/webterminal/v1`,
  };
  return paramObj;
}

// 扩展组件前缀匹配
export const expandComponent = {
  Logging: 'logging',
  ComputingPowerEngine: 'computing-power-engine',
  MonitoringDashboard: 'monitoring-dashboard',
  Colocation: 'colocation',
  Volcano: 'scheduling',
  Cluster: 'cluster',
  Ray: 'ray',
  MisManagement: 'mis-management',
};
