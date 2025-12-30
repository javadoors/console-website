/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button } from 'antd';

export function ButtonComponent({
  title,
  bgColor,
  wSize,
  hSize,
  ftSize,
  icon,
  color,
  fontWeight,
  type,
  onClick,
}) {
  const buttonStyle = {
    backgroundColor: bgColor,
    width: `${wSize}px`,
    height: `${hSize}px`,
    fontSize: `${ftSize}px`,
    icon: '',
    type: 'primary',
    color,
    fontWeight,
  };
  return (
    <Button type={type} style={buttonStyle} icon={icon} onClick={onClick}>
      {title}
    </Button>
  );
}
