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

import { useEffect, useState, useCallback, Fragment, useRef } from 'openinula';
import { Space, Table, Tooltip, Form, Input, ConfigProvider } from 'antd';
import { SyncOutlined, LoadingOutlined } from '@ant-design/icons';
import { filterRepeat, filterResourceJumpStyle, changeCrName } from '@/utils/common';
import { ReleaseStatus } from '@/common/constants';
import zhCN from 'antd/es/locale/zh_CN';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import pluralize from 'pluralize';
import { solveEncodePath } from '@/tools/utils';

let helmBackList = [];
/**
 * @param dataProps // 资源数据
 */
export default function ManagementDetailResource({ dataProps }) {
  const { Search } = Input;
  const history = useHistory();

  const [helmResourceList, setHelmResourceList] = useState([]);
  const [helmSearchForm] = Form.useForm();
  const helmFormRef = useRef(null);
  const [helmDetailFilterObj, setHelmDetailFilterObj] = useState({});
  const [helmDetailTotal, setHelmDetailTotal] = useState(0);
  const [helmDetailCurrent, setHelmDetailCurrent] = useState(1);
  const [helmDetailPageSize, setHelmDetailPageSize] = useState(10);
  const [kindArr, setKindArr] = useState([]); // 类型
  const [currentKind, setCurrentKind] = useState('');
  const [statusArr, setStatusArr] = useState([]); // 状态
  const [currentStatus, setCurrentStatus] = useState('');
  const [helmSortObj, setHelmSortObj] = useState({}); // 排序
  const [helmStatusSortObj, setHelmStatusSortObj] = useState({}); // 状态排序
  const [helmNamespaceSortObj, setHelmNamespaceSortObj] = useState({}); // 命名空间排序
  const [helmTypeSortObj, setHelmTypeSortObj] = useState({}); // 类型排序

  const linkArr = [
    'Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob', 'Service', 'Ingress', 'ConfigMap',
    'Secret', 'ServiceAccount', 'Role', 'RoleBinding', 'Namespace', 'ClusterRole', 'ClusterRoleBinding',
    'PersistentVolume', 'PersistentVolumeClaim', 'StorageClass', 'ServiceMonitor', 'CustomResourceDefinition',
    'ResourceQuota', 'LimitRange',
  ];

  const getHelmResource = () => {
    if (helmFormRef.current) {
      let filtertArr = [];
      if (helmSearchForm.getFieldsValue().name) {
        filtertArr = helmBackList.filter(item => (item.name).includes(helmSearchForm.getFieldsValue().name));
      } else {
        filtertArr = JSON.parse(JSON.stringify(helmBackList));
      }
      if (Object.keys(helmDetailFilterObj).length !== 0) {
        if (!helmDetailFilterObj.helmDetailStatus) {
          setCurrentStatus('');
        } else {
          // 获取筛选框
          let [temporyStatus, ...reset] = helmDetailFilterObj.helmDetailStatus;
          setCurrentStatus(temporyStatus);
          filtertArr = filtertArr.filter(item => item.status?.Status === temporyStatus);
        }
        if (!helmDetailFilterObj.kind) {
          setCurrentKind('');
        } else {
          // 获取筛选框
          let [kind, ...reset] = helmDetailFilterObj.kind;
          setCurrentKind(kind);
          filtertArr = filtertArr.filter(item => item.kind === kind);
        }
      }
      if (Object.keys(helmSortObj).length !== 0) {
        if (helmSortObj.order === 'ascend') {
          filtertArr = filtertArr.sort((a, b) => {
            let nameA = a.name;
            let nameB = b.name;
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
        } else {
          if (helmSortObj.order === 'descend') {
            filtertArr = filtertArr.sort((a, b) => {
              let nameA = a.name;
              let nameB = b.name;
              if (nameA < nameB) {
                return 1;
              }
              if (nameA > nameB) {
                return -1;
              }
              return 0;
            });
          }
        }
      }
      if (Object.keys(helmStatusSortObj).length !== 0) {
        if (helmStatusSortObj.order === 'ascend') {
          filtertArr = filtertArr.sort((a, b) => {
            let statusA = ReleaseStatus[a.status.Status];
            let statusB = ReleaseStatus[b.status.Status];
            if (statusA < statusB) {
              return -1;
            }
            if (statusA > statusB) {
              return 1;
            }
            return 0;
          });
        } else {
          if (helmStatusSortObj.order === 'descend') {
            filtertArr = filtertArr.sort((a, b) => {
              let statusA = ReleaseStatus[a.status.Status];
              let statusB = ReleaseStatus[b.status.Status];
              if (statusA < statusB) {
                return 1;
              }
              if (statusA > statusB) {
                return -1;
              }
              return 0;
            });
          }
        }
      }
      if (Object.keys(helmNamespaceSortObj).length !== 0) {
        if (helmNamespaceSortObj.order === 'ascend') {
          filtertArr = filtertArr.sort((a, b) => {
            let namespaceA = a.namespace;
            let namespaceB = b.namespace;
            if (namespaceA < namespaceB) {
              return -1;
            }
            if (namespaceA > namespaceB) {
              return 1;
            }
            return 0;
          });
        } else {
          if (helmNamespaceSortObj.order === 'descend') {
            filtertArr = filtertArr.sort((a, b) => {
              let namespaceA = a.namespace;
              let namespaceB = b.namespace;
              if (namespaceA < namespaceB) {
                return 1;
              }
              if (namespaceA > namespaceB) {
                return -1;
              }
              return 0;
            });
          }
        }
      }
      if (Object.keys(helmTypeSortObj).length !== 0) {
        if (helmTypeSortObj.order === 'ascend') {
          filtertArr = filtertArr.sort((a, b) => {
            let kindA = a.kind;
            let kindB = b.kind;
            if (kindA < kindB) {
              return -1;
            }
            if (kindA > kindB) {
              return 1;
            }
            return 0;
          });
        } else {
          if (helmTypeSortObj.order === 'descend') {
            filtertArr = filtertArr.sort((a, b) => {
              let kindA = a.kind;
              let kindB = b.kind;
              if (kindA < kindB) {
                return 1;
              }
              if (kindA > kindB) {
                return -1;
              }
              return 0;
            });
          }
        }
      }
      setHelmDetailTotal(filtertArr.length);
      setHelmResourceList([...filtertArr]);
    }
  };

  const handleHelmDetailTableChange =
    (
      pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'paginate') {
        setHelmDetailCurrent(pagination.current || 1);
        setHelmDetailPageSize(pagination.pageSize || 10);
      }
      if (extra.action === 'filter') {
        setHelmDetailFilterObj(filter);
      }
      if (extra.action === 'sort') {
        if (_sorter.columnKey === 'helmDetailStatus') {
          setHelmSortObj({});
          setHelmNamespaceSortObj({});
          setHelmTypeSortObj({});
          setHelmStatusSortObj({ key: _sorter.columnKey, order: _sorter.order });
        } else if (_sorter.columnKey === 'namespace') {
          setHelmSortObj({});
          setHelmStatusSortObj({});
          setHelmTypeSortObj({});
          setHelmNamespaceSortObj({ key: _sorter.columnKey, order: _sorter.order });
        } else if (_sorter.columnKey === 'kind') {
          setHelmSortObj({});
          setHelmStatusSortObj({});
          setHelmNamespaceSortObj({});
          setHelmTypeSortObj({ key: _sorter.columnKey, order: _sorter.order });
        } else {
          setHelmStatusSortObj({});
          setHelmNamespaceSortObj({});
          setHelmTypeSortObj({});
          setHelmSortObj({ key: _sorter.columnKey, order: _sorter.order });
        }
      }
    };

  const setFilterStatusData = useCallback(() => {
    let filterStatusArr = [];
    Object.keys(ReleaseStatus).forEach(element => {
      filterStatusArr.push({ text: ReleaseStatus[element], value: element });
    });
    setStatusArr([...filterStatusArr]);
  }, []);

  // 资源列
  const helmDetailColumns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      sorter: true,
      sortOrder: helmSortObj.order,
      render: (_, record) => (
        <Space>
          {isShowLink(record.kind) ? <p className='resource_name' onClick={() => jumpToDetail(record.kind, record.namespace, record.name, record.apiVersion)}>{record.name}</p>
            : <p style={{ color: '#333' }}>{record.name}</p>}
        </Space>
      ),
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: true,
      sortOrder: helmNamespaceSortObj.order,
      render: (_, record) => record.namespace || '-',
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      filters: kindArr,
      filteredValue: currentKind ? [currentKind] : null,
      filterMultiple: false,
      sorter: true,
      sortOrder: helmTypeSortObj.order,
    },
    {
      title: '状态',
      key: 'helmDetailStatus',
      filters: statusArr,
      filteredValue: currentStatus ? [currentStatus] : null,
      filterMultiple: false,
      sorter: true,
      sortOrder: helmStatusSortObj.order,
      render: (_, record) => (
        <Space>
          <Tooltip title={ReleaseStatus[record.status?.Status] === '失败' ? record.status.Message : ''}>
            <div className="status">
              {ReleaseStatus[record.status?.Status] !== '创建中' && <div className={ReleaseStatus[record.status?.Status] === '运行中' ? 'already_success' : 'already_error'}></div>}
              {ReleaseStatus[record.status?.Status] === '创建中' && <LoadingOutlined id="wait_moment" />}
              <div className="word">{ReleaseStatus[record.status?.Status]}</div>
            </div>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 获取数据
  const getHelmDetail = useCallback(async () => {
    setHelmResourceList(dataProps.resources);
    // 设置全局不被污染量
    helmBackList = dataProps.resources;
    setHelmDetailTotal(dataProps.resources?.length);
    // 赋值类型
    if (dataProps.resources) {
      let temporyKindList = [];
      helmBackList.map(item => {
        temporyKindList.push({ text: item.kind, value: item.kind });
      });
      setKindArr([...filterRepeat(temporyKindList)]);
    }
  }, []);

  const helmDetailResetSearch = useCallback(() => {
    getHelmDetail();
    helmSearchForm.resetFields();
    setCurrentKind('');
    setCurrentStatus(''); // 重置筛选条件
    setHelmSortObj({});
    setHelmDetailFilterObj({});
    setHelmDetailCurrent(1);
  }, [helmSearchForm]);

  const isShowLink = (type) => {
    const result = linkArr.includes(type);
    return result;
  };

  const createResource = {
    Pod: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    Deployment: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    StatefulSet: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    DaemonSet: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    Job: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    CronJob: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/workload/${lowerType}/detail/${namespace}/${name}` });
    },
    Service: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/network/${lowerType}/serviceDetail/${namespace}/${name}` });
    },
    Ingress: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/network/${lowerType}/ingressDetail/${namespace}/${name}` });
    },
    ConfigMap: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/configuration/${lowerType}/ConfigurationDetail/${namespace}/${name}` });
    },
    Secret: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/configuration/${lowerType}/SecretDetail/${namespace}/${name}` });
    },
    ServiceAccount: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/userManage/${lowerType}/detail/${namespace}/${name}` });
    },
    Role: (namespace, name, apiVersion, lowerType) => {
      history.push({
        pathname: `/${containerRouterPrefix}/userManage/role/detail`,
        state: {
          roleType: 'role',
          roleNamespace: `${namespace}`,
          roleName: `${name}`,
        },
      });
    },
    RoleBinding: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/userManage/roleBinding/detail/${namespace}/${name}` });
    },
    Namespace: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/namespace/namespaceManage/detail/${name}` });
    },
    LimitRange: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/namespace/limitRange/detail/${name}` });
    },
    ResourceQuota: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/namespace/resourceQuota/detail/${namespace}/${name}` });
    },
    ClusterRole: (namespace, name, apiVersion, lowerType) => {
      history.push({
        pathname: `/${containerRouterPrefix}/userManage/role/detail`,
        state: {
          roleType: 'clusterrole',
          roleNamespace: '',
          roleName: `${name}`,
        },
      });
    },
    ClusterRoleBinding: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/userManage/clusterRoleBinding/detail/${name}` });
    },
    PersistentVolume: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/resourceManagement/pv/PvDetail/${name}` });
    },
    PersistentVolumeClaim: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/resourceManagement/pvc/PvcDetail/${namespace}/${name}` });
    },
    StorageClass: (namespace, name, apiVersion, lowerType) => {
      history.push({ pathname: `/${containerRouterPrefix}/resourceManagement/sc/ScDetail/${name}` });
    },
    ServiceMonitor: (namespace, name, apiVersion, lowerType) => {
      const prefixObjl = {
        group: 'monitoring.coreos.com',
        version: 'v1',
        plural: 'servicemonitors',
      };
      history.push({
        pathname: `/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/detail/${namespace}/${name}`,
        state: { ...prefixObjl },
      });
    },
    CustomResourceDefinition: (namespace, name, apiVersion, lowerType) => {
      history.push({
        pathname: `/${containerRouterPrefix}/customResourceDefinition/detail/${solveEncodePath(name)}`,
      });
    },
  };

  // 名称路由跳转
  const jumpToDetail = (type, namespace, name, apiVersion) => {
    let firstString = type.charAt(0);
    let changeString = firstString.toLowerCase();
    let lowerType = changeString + type.slice(1);
    createResource[type](namespace, name, apiVersion, lowerType);
  };

  useEffect(() => {
    getHelmResource();
  }, [helmDetailFilterObj, helmSortObj, helmNamespaceSortObj, helmTypeSortObj, helmStatusSortObj]);

  useEffect(() => {
    setFilterStatusData();
    getHelmDetail();
  }, [getHelmDetail, setFilterStatusData]);

  return <div className="helm_tab_container container_margin_box">
    <div className="resource_card">
      <div className="resource_top_search">
        <Form form={helmSearchForm} ref={helmFormRef} className="toolsBox" autoComplete="off">
          <Form.Item name="name" className='search' style={{ marginBottom: '0' }}>
            <Search
              placeholder="资源名称"
              onSearch={() => getHelmResource()}
              maxLength={53}
            />
          </Form.Item>
        </Form>
      </div>
      <ConfigProvider locale={zhCN}>
        <Table className="table"
          rowKey="id"
          pagination={{
            className: 'page',
            pageSizeOptions: ['10', '20', '50'],
            current: helmDetailCurrent,
            pageSize: helmDetailPageSize,
            total: helmDetailTotal || 0,
            showTotal: (helmDetailAllTotal) => `共${helmDetailTotal}条`,
            showSizeChanger: true,
          }}
          dataSource={helmResourceList}
          columns={helmDetailColumns}
          onChange={handleHelmDetailTableChange} />
      </ConfigProvider>
    </div>
  </div>;
}