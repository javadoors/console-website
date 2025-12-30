
/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/podDetail.less';
import { useState, createRef, useContext, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addDeploymentYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { NamespaceContext } from '@/namespaceContext';
import { deploymentYamlExample } from '@/common/exampleYaml';
export default function DeploymentCreate() {
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [deploymentYaml, setDeploymentYaml] = useState(deploymentYamlExample);
  const [messageApi, contextHolder] = message.useMessage();
  const childCodeMirrorRef = createRef(null);
  const themeStore = useStore('theme');
  const handleCopyYaml = () => {
    copy(deploymentYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setDeploymentYaml(str);
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let passNamespace = namespace; // 默认选择当前空间
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(deploymentYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (yamlJson.metadata && yamlJson.metadata.namespace) {
        passNamespace = yamlJson.metadata.namespace; // 传入文件的命名空间优先级best
      }
      if (passNamespace) {
        try {
          const res = await addDeploymentYamlData(passNamespace, yamlJson);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(`/${containerRouterPrefix}/workload/deployment`);
            }, 2000);
          }
        } catch (deploymentCreateError) {
          if (deploymentCreateError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, deploymentCreateError);
          } else {
            messageApi.error(`创建失败！${deploymentCreateError.response.data.message}`);
          }
        }
      } else {
        messageApi.error('命名空间必须填写！');
      }
    }
  };

  const handleResetCode = () => {
    setDeploymentYaml(deploymentYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(deploymentYamlExample);
  };

  const exportYaml = () => {
    exportYamlOutPut('Deployment', deploymentYaml);
    messageApi.success('导出成功');
  };

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'Deployment', path: `/deployment` },
      { title: '创建', path: `/createDeployment` },
    ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>

            <div className="tool_word_group" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={deploymentYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}