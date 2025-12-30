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
import { Button, Form, Space, Input, Table, ConfigProvider, Popover, message } from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { getIngressData, deleteIngress } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import zhCN from 'antd/es/locale/zh_CN';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function IngressTab() {
  const [ingressForm] = Form.useForm();
  const themeStore = useStore('theme');

  const namespace = useContext(NamespaceContext);

  const history = useHistory();

  const [ingressTotal, setIngressTotal] = useState(0);

  const [ingressList, setIngressList] = useState([]);

  const [ingressLoading, setIngressLoading] = useState(false); // 加载中

  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [ingressIndexDeleteModal, setIngressIndexDeleteModal] = useState(false);

  const [isIngressIndexCheck, setIsIngressIndexCheck] = useState(false);

  const [ingressIndexDeleteName, setIngressIndexDeleteName] = useState('');

  const [ingressDelNamespace, setIngressDelNamespace] = useState(''); // 删除的命名空间

  const [messageApi, contextHolder] = message.useMessage();

  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handleIngressReset = () => {
    getIngressList();
  };

  const handleDeleteIngress = (record) => {
    setPopOpen('');
    setIsIngressIndexCheck(false);
    setIngressIndexDeleteModal(true);
    setIngressIndexDeleteName(record.metadata.name);
    setIngressDelNamespace(record.metadata.namespace);
  };

  // model的删除按钮
  const handleIngressIndexConfirmDelete = async () => {
    try {
      const res = await deleteIngress(ingressDelNamespace, ingressIndexDeleteName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setIngressIndexDeleteModal(false);
        setIsIngressIndexCheck(false);
        setIngressDelNamespace('');
        getIngressList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  // model的取消按钮
  const ingressIndexCancelModal = () => {
    setIngressIndexDeleteModal(false);
    setIngressDelNamespace('');
  };

  // 接受check回调
  const recieveCheck = (e) => {
    setIsIngressIndexCheck(e.target.checked);
  };

  // 处理外部端口数据
  const filterService = (arr) => {
    let _arr = [];
    let value = '';
    arr.filter(item => {
      if (item.http.paths) {
        item.http.paths.map(i => {
          _arr.push(i.backend.service.name);
        });
      } else {
        value = '--';
      }
    });
    if (_arr.length) {
      value = _arr.toString('');
    } else {
      value = '--';
    }
    return value;
  };

  // 列表项
  const IngressColumns = [
    {
      title: '服务名称',
      key: 'ingress_name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Space>
        <Link to={`/${containerRouterPrefix}/network/ingress/IngressDetail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>
      </Space>,
    },
    {
      title: '服务',
      key: 'ingress_service',
      sorter: (a, b) => sorterFirstAlphabet(filterService(a.spec.rules), filterService(b.spec.rules)),
      render: (_, record) => <Space>
        {filterService(record.spec?.rules)}
      </Space>,
    },
    {
      title: '命名空间',
      key: 'ingress_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => <Space>
        {record.metadata.namespace}
      </Space>,
    },
    {
      title: '创建时间',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      key: 'create_time',
      render: (_, record) => <Space>
        {Dayjs(record.metadata.creationTimestamp ? record.metadata.creationTimestamp : '--').format('YYYY-MM-DD HH:mm')}
      </Space>,
    },
    {
      title: '操作',
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom" content={<div className="pop_modal">
            <Button type="link"><Link to={`/${containerRouterPrefix}/network/ingress/IngressDetail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
            <Button type="link" onClick={() => handleDeleteIngress(record)}>删除</Button></div>
          } trigger="click" open={popOpen === record.metadata.uid} onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // 获取ingressList
  const getIngressList = useCallback(async () => {
    setIngressLoading(true);
    try {
      const res = await getIngressData(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        if (ingressForm.getFieldValue('ingress_name')) {
          handleSearchIngress(res.data.items);
        } else {
          setIngressList([...res.data.items]);
          setIngressTotal(res.data.items.length);
        }
      }
    } catch (e) {
      setIngressList([]);
      setIngressTotal(0);
    }
    setIngressLoading(false);
  }, [namespace]);

  const handleSearchIngress = (totalData = originalList) => {
    const ingressFormName = ingressForm.getFieldValue('ingress_name');
    let temporyList = [];
    if (ingressFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(ingressFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setIngressList([...temporyList]);
    setIngressTotal(temporyList.length);
  };

  useEffect(() => {
    getIngressList();
  }, [getIngressList]);

  return <div className="network-tab-container">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <Form className="network-searchForm form_padding_bottom" form={ingressForm}>
      <Form.Item name="ingress_name" className="network-search-input">
        <Input.Search placeholder="搜索Ingress名称" onSearch={() => handleSearchIngress()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/network/ingress/createIngress`)}>创建</Button>
          <Button icon={<SyncOutlined />} onClick={handleIngressReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={ingressLoading}
          columns={IngressColumns}
          dataSource={ingressList}
          pagination={{
            className: 'page',
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            total: ingressTotal,
            pageSizeOptions: [10, 20, 50],
          }}
        >
        </Table>
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title="删除Ingress"
      open={ingressIndexDeleteModal}
      cancelFn={ingressIndexCancelModal}
      content={[
        '删除Ingress后无法恢复，请谨慎操作。',
        `确定删除Ingress ${ingressIndexDeleteName} 吗？`,
      ]}
      isCheck={isIngressIndexCheck}
      showCheck={true}
      checkFn={recieveCheck}
      confirmFn={handleIngressIndexConfirmDelete}
    />
  </div>;
}