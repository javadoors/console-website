/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Input } from 'antd';
import { useState } from 'openinula';

export function Search({ placeHolder, wSize, hSize, border, children }) {
  const [search, onSearch] = useState('');
  const searchStyle = {
    width: `${wSize}px`,
    height: `${hSize}px`,
    marginBottom: '20px',
  };
  return (
    <div>
      <Input.Search
        type='text'
        value={search}
        style={searchStyle}
        placeHolder={placeHolder}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
