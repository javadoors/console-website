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
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message } from 'antd';
import { containerRouterPrefix } from '@/constant';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState, useContext, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode, namespaceStatusOptions } from '@/common/constants';
import { getLimitRangeList, deleteLimitRange } from '@/api/containerApi';
import { Link, useHistory } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import Dayjs from 'dayjs';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function LimitRangePage() {
  const [limitRangeForm] = Form.useForm();
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [limitRangePage, setLimitRangePage] = useState(DEFAULT_CURRENT_PAGE);
  const [limitRangeListData, setLimitRangeListData] = useState([]); // table
  const [limitRangeLoading, setLimitRangeLoading] = useState(false); // 加载中
  const themeStore = useStore('theme');
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示

  const [limitRangeDelModalOpen, setLimitRangeDelModalOpen] = useState(false); // 删除对话框展示
  const [limitRangeDelName, setLimitRangeDelName] = useState(''); // 删除的名称
  const [limitRangeDelNamespace, setLimitRangeDelNamespace] = useState('');
  const [isLimitRangeDelCheck, setIsLimitRangeDelCheck] = useState(false); // 是否选中

  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handleLimitRangeOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const limitRangeColumns = [
    {
      title: '限制范围名称',
      key: 'limitRange_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/namespace/limitRange/detail/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '命名空间',
      key: 'limitRange_namespace',
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '创建时间',
      key: 'limitRange_created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'limitRange_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement="bottom"
          content={
            <div className="pop_modal">
              <Button type="link"><Link to={`/${containerRouterPrefix}/namespace/limitRange/detail/${record.metadata.namespace}/${record.metadata.name}/yaml`}>修改</Link></Button>
              <Button type="link" onClick={() => handleDeleteLimitRange(record)}>删除</Button>
            </div>
          }
          trigger="click"
          open={popOpen === record.metadata.uid}
          onOpenChange={e => handleLimitRangeOpenChange(e, record)}>
          <MoreOutlined className="common_antd_icon primary_color" />
        </Popover>
      </Space>,
    },
  ];

  const getLimitRangeListData = useCallback(async (isChange = true) => {
    setLimitRangeLoading(true);
    try {
      const res = await getLimitRangeList(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchLimitRange(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setLimitRangeListData([]); // 数组为空
      }
    }
    setLimitRangeLoading(false);
  }, [namespace]);

  // 重置按钮
  const handleLimitRangeReset = () => {
    getLimitRangeListData(false);
  };

  // 删除按钮
  const handleDeleteLimitRange = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setLimitRangeDelModalOpen(true); // 打开弹窗
    setLimitRangeDelName(record.metadata.name);
    setLimitRangeDelNamespace(record.metadata.namespace);
  };

  const handleDelLimitRangeCancel = () => {
    setLimitRangeDelModalOpen(false);
    setLimitRangeDelName('');
    setLimitRangeDelNamespace('');
    setIsLimitRangeDelCheck(false);
  };

  const handleDelLimitRangeConfirm = async () => {
    try {
      const res = await deleteLimitRange(limitRangeDelNamespace, limitRangeDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setLimitRangeDelModalOpen(false);
        setLimitRangeDelName('');
        setLimitRangeDelNamespace('');
        setIsLimitRangeDelCheck(false);
        getLimitRangeListData();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  // 检索
  const handleSearchLimitRange = (totalData = originalList, isChange = true) => {
    const limitRangeFormName = limitRangeForm.getFieldValue('limitRange_name');
    let temporyList = totalData;
    if (limitRangeFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(limitRangeFormName.toLowerCase()));
    }
    setLimitRangeListData([...temporyList]);
    isChange ? setLimitRangePage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleLimitRangeCheckFn = (e) => {
    setIsLimitRangeDelCheck(e.target.checked);
  };

  useEffect(() => {
    getLimitRangeListData();
  }, [getLimitRangeListData]);

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '命名空间', path: `/${containerRouterPrefix}/namespace/limitRange`, disabled: true },
      { title: 'LimitRange', path: `/` }]} />
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={limitRangeForm}>
        <Form.Item name="limitRange_name" className="search_input">
          <Input.Search placeholder="搜索限制范围名称" onSearch={() => handleSearchLimitRange()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/namespace/limitRange/createLimitRange`)}>创建</Button>
            <Button icon={<SyncOutlined />} onClick={handleLimitRangeReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex cluster_container_height">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={limitRangeLoading}
            columns={limitRangeColumns}
            dataSource={limitRangeListData}
            pagination={{
              className: 'page',
              current: limitRangePage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setLimitRangePage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除限制范围"
        open={limitRangeDelModalOpen}
        cancelFn={handleDelLimitRangeCancel}
        content={[
          '删除限制范围后将无法恢复，请谨慎操作。',
          `确定删除限制范围 ${limitRangeDelName} 吗？`,
        ]}
        isCheck={isLimitRangeDelCheck}
        showCheck={true}
        checkFn={handleLimitRangeCheckFn}
        confirmFn={handleDelLimitRangeConfirm} />
    </div>
  </div>;
}