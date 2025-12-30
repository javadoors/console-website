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
import '@/styles/pages/network.less';
import { useState, createRef, useContext, useEffect, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addIngressYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { NamespaceContext } from '@/namespaceContext';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { ingressYamlExample } from '@/common/exampleYaml';

export default function IngressCreate() {
  const themeStore = useStore('theme');
  const history = useHistory();
  const namespace = useContext(NamespaceContext);

  const [ingressYaml, setIngressYaml] = useState(ingressYamlExample);

  const [ingressYamlName, setIngressYamlName] = useState('');

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(ingressYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    if (ingressYamlName) {
      exportYamlOutPut(`Ingress`, ingressYaml);
    } else {
      exportYamlOutPut(`Ingress`, ingressYaml);
    }
    messageApi.success('导出成功！');
  };

  const handleChangeYaml = (str) => {
    setIngressYaml(str);
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let passNamepsace = namespace;
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(ingressYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (yamlJson.metadata && yamlJson.metadata.namespace) {
        passNamepsace = yamlJson.metadata.namespace;
      }
      if (passNamepsace) {
        try {
          const res = await addIngressYamlData(passNamepsace, yamlJson);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(`/${containerRouterPrefix}/network/ingress`);
            }, 2000);
          }
        } catch (ingressCreateError) {
          if (ingressCreateError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, ingressCreateError);
          } else {
            messageApi.error(`创建失败！${ingressCreateError.response.data.message}`);
          }
        }
      } else {
        messageApi.error('命名空间必须填写！');
      }
    }
  };

  const handleResetCode = () => {
    setIngressYaml(ingressYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(ingressYamlExample);
  };

  useEffect(() => {
    setIngressYamlName(yamlTojson(serviceYaml).metadata.name);
  }, [ingressYaml]);

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom
      className='create_bread'
      items={[
        { title: '网络', path: `/${containerRouterPrefix}/network`, disabled: true },
        { title: 'Ingress', path: `/ingress` },
        { title: '创建Ingress', path: `/createIngress` },
      ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML（读写）</h3>
          <div className="yaml_tools">
            <div className="tool_word_group ingressCreateExport" onClick={handleExportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group ingressCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={ingressYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="net_btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}