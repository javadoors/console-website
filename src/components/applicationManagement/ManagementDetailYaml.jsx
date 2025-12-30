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

import { useCallback, useEffect, useState, createRef, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, QuestionCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Checkbox, Tooltip } from 'antd';
import { getHelmDetailYaml, getHelmDetailYamlOnlyValue } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { jsonToYaml, exportYamlOutPut } from '@/tools/utils';
/**
 * @param nameProps // 名称
 * @param namespaceProps // 命名空间
 */
export default function ManagementDetailYaml({ nameProps, namespaceProps }) {
  const [helmYaml, setHelmYaml] = useState('');
  const themeStore = useStore('theme');
  const [loading, setLoading] = useState(true); // 判断子组件是否加载

  const [messageApi, contextHolder] = message.useMessage();

  const [yamlName, setYamlName] = useState(nameProps);

  const [yamlNamespace, setYamlNamespace] = useState(namespaceProps);

  const [isOnlyValue, setIsOnlyValue] = useState(false);

  const prompt = 'values是helm chart中用于存储配置参数的文件';

  const childCodeMirrorRef = createRef(null);

  const getHelmYaml = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHelmDetailYaml(yamlNamespace, yamlName);
      if (res.status === ResponseCode.OK) {
        setHelmYaml(res.data.data);
      }
      setLoading(false);
    } catch (e) {
      messageApi.error('获取yaml失败');
    }
  }, []);

  const handleCopyYaml = () => {
    copy(helmYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    if (!isOnlyValue) {
      exportYamlOutPut(yamlName, helmYaml);
    } else {
      exportYamlOutPut('Values', helmYaml);
    }
    messageApi.success('导出成功');
  };

  const onChangeYaml = useCallback(async (e) => {
    if (e.target.checked) {
      setIsOnlyValue(true);
      setLoading(true);
      const res = await getHelmDetailYamlOnlyValue(yamlNamespace, yamlName);
      if (res.status === ResponseCode.OK) {
        setHelmYaml(jsonToYaml(JSON.stringify(res.data.data)));
      }
      setLoading(false);
    } else {
      setIsOnlyValue(false);
      getHelmYaml();
    }
  }, []);

  useEffect(() => {
    getHelmYaml();
  }, []);

  return <div className="helm_tab_container container_margin_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <div className='helm_yaml_left'>
          <h3 className="box_title_h3" style={{ marginRight: '10px' }}>YAML</h3>
          <Checkbox onChange={onChangeYaml}>只显示Values</Checkbox>
          <Tooltip placement="topLeft" title={prompt}>
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
        <div className="yaml_tools">
          <div className="tool_word_group managementDetailExport" onClick={handleExportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group managementDetailYamlCopy" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className="yaml_space_box">
      {!loading && <CodeMirrorEditor yamlData={helmYaml} isEdit={false} ref={childCodeMirrorRef} />}
    </div>
  </div>;
}