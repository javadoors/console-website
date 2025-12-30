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
import '@/styles/pages/resourceManage.less';
import { useState, createRef, useContext, useEffect } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addScYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { NamespaceContext } from '@/namespaceContext';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { scYamlExample } from '@/common/exampleYaml';

export default function ScCreate() {
  const history = useHistory();

  const namespace = useContext(NamespaceContext);

  const [scYaml, setScYaml] = useState(scYamlExample);

  const [scYamlName, setScYamlName] = useState('');

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(scYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    if (scYamlName) {
      exportYamlOutPut(`Sc`, scYaml);
    } else {
      exportYamlOutPut(`Sc`, scYaml);
    }
    messageApi.success('导出成功！');
  };

  const handleChangeYaml = (str) => {
    setScYaml(str);
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(scYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await addScYamlData(yamlJson);
        if (res.status === ResponseCode.Created) {
          messageApi.success('创建成功');
          setTimeout(() => {
            history.push(`/${containerRouterPrefix}/resourceManagement/sc`);
          }, 2000);
        }
      } catch (scError) {
        if (scError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, scError);
        } else {
          messageApi.error(`创建失败！${scError.response.data.message}`);
        }
      }
    }
  };

  const handleResetCode = () => {
    setScYaml(scYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(scYamlExample);
  };

  useEffect(() => {
    setScYamlName(yamlTojson(serviceYaml).metadata.name);
  }, [scYaml]);

  return <div className="child_content withBread_content">
    {contextHolder}
    <BreadCrumbCom
      className='create_bread'
      items={[
        { title: '存储', path: `/${containerRouterPrefix}/resourceManagement`, disabled: true },
        { title: '存储池(SC)', path: `/sc` },
        { title: '创建存储池(SC)', path: `/createSc` },
      ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML（读写）</h3>
          <div className="yaml_tools">
            <div className="tool_word_group scCreateExport" onClick={handleExportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group scCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={scYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="resource-storge_btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}