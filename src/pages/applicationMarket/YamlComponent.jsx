/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import YamlHeader from '@/pages/container/configuration/component/YamlHeader';
import YamlOperator from '@/pages/container/configuration/component/YamlOperator';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import {
  SearchOutlined,
  DownloadOutlined,
  CopyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

export default function YamlComponent({
  title,
  configurationValue,
  onchangeYaml,
}) {
  return (
    <div>
      <div>
        <YamlHeader title={title}>
          <YamlOperator icon={<DownloadOutlined />} operator='导出' />
          <YamlOperator icon={<SearchOutlined />} operator='查找 ' />
          <YamlOperator icon={<CopyOutlined />} operator='复制' />
          <YamlOperator icon={<ThunderboltOutlined />} operator='自动' />
        </YamlHeader>
      </div>
      <CodeMirrorEditor
        yamlData={configurationValue}
        changeYaml={onchangeYaml}
      />
    </div>
  );
}
