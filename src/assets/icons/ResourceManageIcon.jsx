/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import resourceManageDarkIcon from '@/assets/images/menu/resourceManageDarkIcon.png';
import resourceManageSelectedIcon from '@/assets/images/menu/resourceManageSelectedIcon.png';
import resourceManageIcon from '@/assets/images/menu/resourceManageIcon.png';
const resourceManageFilled = (theme) => (
  <img src={theme === 'light' ? resourceManageSelectedIcon : resourceManageDarkIcon} />
);

const resourceManageOutlined = (theme) => (
  <img src={resourceManageIcon} />
);

export default function ResourceManageIcon(selected, theme) {
  return (
    <div className="menu-icon">
      {selected ? resourceManageFilled(theme) : resourceManageOutlined(theme)}
    </div>
  );
}