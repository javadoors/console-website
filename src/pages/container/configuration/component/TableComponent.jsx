/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Table, Pagination, ConfigProvider } from 'antd';
import { useState } from 'openinula';
import zhCN from 'antd/es/locale/zh_CN';
import '@/styles/pages/configuration.less';

export function TableComponent({ dataSource, columns, pageSize }) {
  const [podTotal, setPodTotal] = useState(0);
  return (
    <div className='config_table'>
      <ConfigProvider locale={zhCN}>
        <Table dataSource={dataSource} columns={columns} pagination={false} />
        <Pagination
          className='page'
          showTotal={(total) => `共${total}条`}
          showSizeChanger
          showQuickJumper
          total={podTotal}
          pageSizeOptions={[10, 20, 50]}
        ></Pagination>
      </ConfigProvider>
    </div>
  );
}
