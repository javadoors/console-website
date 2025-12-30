/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import { ExportOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import DetailHeader from '@/pages/container/configuration/component/DetailHeader';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { Tabs, Button, message } from 'antd';
import '@/styles/pages/configuration.less';
import { useEffect, useRef, useState, useStore, useCallback } from 'openinula';
import { useParams } from 'inula-router';
import { getSecretDetails, updateSecrets, updateSecretLabelAnnotation } from '@/api/containerApi';
import { solveAnnotation, jsonToYaml } from '@/tools/utils';
import { useHistory } from 'inula-router';
import Dayjs from 'dayjs';
import { Breadcrumb, Tag } from 'antd';
import { Link } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import copy from 'copy-to-clipboard';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotationOrLabelDiff } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';

export default function SecretUpdate() {
  const { secretNameSpace, secretName, activeKey } = useParams();
  const [secretData, setSecretData] = useState(null);
  const [secretLoading, setSecretLoading] = useState(false);
  const [yamlData, setYamlData] = useState('');
  const [dataInfo, setDataInfo] = useState('');
  const [secretDetailTabKey, setSecretDetailTabKey] = useState(activeKey || 'detail');
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 获取详情基本信息
  const getSecretDetailsInfo = useCallback(async () => {
    if (secretNameSpace && secretName) {
      setSecretLoading(false);
      const res = await getSecretDetails(secretNameSpace, secretName);
      if (res.status === 200) {
        setYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setSecretData(res.data);
        setDataInfo(jsonToYaml(JSON.stringify(res.data?.data)));
        setSecretLoading(true);
      }
      setSecretLoading(true);
    }
  }, [secretName, secretNameSpace]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Details
        secretData={secretData}
        dataInfo={dataInfo}
        secretNameSpace={secretNameSpace}
        secretName={secretName}
        refreshFn={getSecretDetailsInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: (
        <YamlDetail
          yamlData={yamlData}
          onSetYamlData={setYamlData}
          secretNameSpace={secretNameSpace}
          secretName={secretName}
          readOnly={isReadyOnly}
          handleEditFn={handleReadyOnly}
          refreshFn={getSecretDetailsInfo}
        />
      ),
    },
  ];
  const handleSecretDetailIndex = (key) => {
    setSecretDetailTabKey(key);
  };

  const handleEditYaml = () => {
    setSecretDetailTabKey('detail');
  };

  useEffect(() => {
    if (secretDetailTabKey === 'detail' || secretDetailTabKey === 'yaml') {
      getSecretDetailsInfo();
    }
  }, [getSecretDetailsInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return (
    <div className='configmap child_content withBread_content SecretUpdate'>
      {contextHolder}
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      </div>
      <BreadCrumbCom
        items={[
          { title: '配置与密钥', key: 'configMap', disabled: true },
          { title: 'Secret', path: `/${containerRouterPrefix}/configuration/secret` },
          { title: '详情', key: 'detail' },
        ]}
      />
      {secretLoading && <DetailHeader
        secretNameSpace={secretNameSpace}
        secretName={secretName}
        onEdit={handleEditYaml}
        getSecretDetailsInfo={getSecretDetailsInfo}
        type='secret'
        title={secretName}
        secretLoading={secretLoading}
        secretData={secretData}
      />}
      {secretLoading && <Tabs items={items} activeKey={secretDetailTabKey} onChange={handleSecretDetailIndex} destroyInactiveTabPane></Tabs>}
    </div>
  );
}

function YamlDetail({ secretNameSpace, secretName, yamlData, onSetYamlData, readOnly, handleEditFn, refreshFn }) {
  const [newYaml, setNewYaml] = useState(yamlData);
  const history = useHistory();
  const yamlRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const handleChangeYaml = (e) => {
    setNewYaml(e);
  };

  const handleResetCode = () => {
    yamlRef.current.resetCodeEditor(yamlData);
  };

  const exportYamlSecretUpdate = () => {
    exportYamlOutPut(secretName, newYaml);
    messageApi.success('导出成功');
  };

  const handleCopyYamlSecretUpdate = () => {
    copy(newYaml);
    messageApi.success('复制成功！');
  };

  const handleUpdateSecretUpdate = async () => {
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(newYaml);
    } catch (yamlSecretUpdateError) {
      messageApi.error(`YAML格式不规范!${yamlSecretUpdateError.message}`);
      return;
    };
    try {
      const res = await updateSecrets(secretNameSpace, yamlTojson(newYaml), secretName);
      if (res.status === 200) {
        messageApi.success('修改成功');
        setTimeout(() => {
          refreshFn();
          handleEditFn(true);
        }, 1000);
      }
    } catch (editSecretError) {
      messageApi.error(editSecretError.response.data.message);
    }
  };

  const handleResetSecretUpdate = () => {
    yamlRef.current.resetCodeEditor(yamlData);
    setNewYaml(yamlData);
  };

  const handleCodeCancelSecretUpdate = () => {
    setNewYaml(yamlData);
    handleEditFn(true);
  };
  return (
    <div>
      <div className='tab_container SecretUpdateClass'>
        <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
          {contextHolder}
        </div>
        <div className='yaml_card'>
          <div className='yaml_flex_box SecretUpdateClass'>
            {readOnly ? <div style={{ display: 'flex', gap: '8px' }}><h3>YAML</h3><EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /></div> : <h3>YAML</h3>}
            <div className='yaml_tools'>
              <div className='tool_word_group' onClick={exportYamlSecretUpdate}>
                <ExportOutlined className='common_antd_icon primary_color' />
                <span>导出</span>
              </div>
              <div className='tool_word_group' onClick={handleCopyYamlSecretUpdate}>
                <CopyOutlined className='common_antd_icon primary_color' />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 32px' }}>
          <CodeMirrorEditor
            isEdit={!readOnly}
            yamlData={yamlData}
            ref={yamlRef}
            changeYaml={handleChangeYaml}
            clearFn={handleResetCode}
          />
          {
            !readOnly && <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button className='cancel_btn' onClick={handleCodeCancelSecretUpdate}>取消</Button>
              <Button className='cancel_btn' onClick={handleResetSecretUpdate}>重置</Button>
              <Button className='primary_btn' onClick={handleUpdateSecretUpdate}>确定</Button>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function Details({ secretData, dataInfo, secretNameSpace, secretName, refreshFn }) {
  const history = useHistory();
  const childCodeMirrorRef = useRef(null);
  const [oldAnnotations, setOldAnnotataions] = useState(secretData.metadata.annotations); // 未修改前注解
  const [oldLabels, setOldLabels] = useState(secretData.metadata.labels);
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isScretUpdateLabelModalOpen, setIsScretUpdateLabelModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  // 标签成功回调
  const handleLabelOkSecretUpdate = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsScretUpdateLabelModalOpen(false);
      return;
    }
    const keyArrSecretUpdate = [];
    data.map(item => keyArrSecretUpdate.push(item.key));
    if (keyArrSecretUpdate.filter((item, index) => keyArrSecretUpdate.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的标签
      const addLabelListSecretUpdate = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
      try {
        await updateSecretLabelAnnotation(secretNameSpace, addLabelListSecretUpdate, secretName);
        messageApi.success('编辑标签成功');
        setTimeout(() => {
          refreshFn();
          setIsScretUpdateLabelModalOpen(false);
        }, 1000);
      } catch (secretUpdateError) {
        if (secretUpdateError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, secretUpdateError);
        } else {
          messageApi.error(`编辑标签失败！${secretUpdateError.response?.data.message}`);
        }
      };
    };
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsScretUpdateLabelModalOpen(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      // SecretUpdate 判断注解是否修改
      setIsAnnotationModalOpen(false);
      return;
    }
    const keyArrSecretAnnotattion = [];
    data.map(item => keyArrSecretAnnotattion.push(item.key));
    if (keyArrSecretAnnotattion.filter((item, index) => keyArrSecretAnnotattion.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的注解
      const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
      try {
        await updateSecretLabelAnnotation(secretNameSpace, addAnnotationList, secretName);
        messageApi.success('编辑注解成功');
        setTimeout(() => {
          refreshFn(); // 先刷新防止页面抖动
          setIsAnnotationModalOpen(false);
        }, 1000);
      } catch (secretUpdateAnnotationError) {
        if (secretUpdateAnnotationError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, secretUpdateAnnotationError);
        } else {
          messageApi.error(`编辑注解失败！${secretUpdateAnnotationError.response?.data.message}`);
        }
      };
    };
  };
  // 注解失败回调
  const handleAnnotationCancelSecretUpdate = () => {
    setIsAnnotationModalOpen(false);
  };
  return (
    <div className='detail_info SecretUpdate' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34' }}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div>
        <div className='fz_16 fw_bold' style={{ marginBottom: '32px' }}>
          基本信息
        </div>
        <div className='basic_info SecretUpdate'>
          <div className='basic_info_title'>secret名称</div>
          <div className='basic_info_value'>{secretData?.metadata?.name}</div>
        </div>
        <div className='basic_info'>
          <div className='basic_info_title'>命名空间</div>
          <div className='basic_info_value'>
            {secretData?.metadata?.namespace}
          </div>
        </div>
        <div className='basic_info'>
          <div className='basic_info_title'>创建时间</div>
          <div className='basic_info_value'>
            {Dayjs(secretData?.metadata?.creationTimestamp).format(
              'YYYY-MM-DD HH:mm:ss'
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ color: '#89939b' }}>标签:</div>
          <EditOutlined className='primary_icon common_antd_icon' onClick={() => setIsScretUpdateLabelModalOpen(true)} />
        </div>
        <AnnotationModal open={isScretUpdateLabelModalOpen} type='label' dataList={secretData?.metadata?.labels} callbackOk={handleLabelOkSecretUpdate} callbackCancel={handleLabelCancel} />
        <div className='key_value' style={{ marginBottom: '16px' }}>
          {secretData?.metadata?.labels?.length ? secretData?.metadata?.labels?.map(item => {
            return <div className='label_item SecretUpdate'>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'} className='label_tag_key'>{item.key}</Tag>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#444444'} className='label_tag_value'>{item.value}</Tag>
            </div>;
          }) : <span style={{ marginTop: '13px' }}>0个</span>}
        </div>
        <div className='SecretUpdate' style={{ display: 'flex', gap: '8px' }}>
          <div style={{ color: '#89939b' }}>注解:</div>
          <EditOutlined className='primary_icon common_antd_icon SecretUpdate' onClick={() => setIsAnnotationModalOpen(true)} />
        </div>
        <AnnotationModal open={isAnnotationModalOpen} type='annotation' dataList={secretData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancelSecretUpdate} />
        <div className='key_value' style={{ marginBottom: '16px' }}>
          {secretData?.metadata?.annotations?.length ? secretData?.metadata?.annotations?.map(item => {
            return <div className='label_item SecretUpdate'>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'} className='label_tag_key'>{item.key}</Tag>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#444444'} className='label_tag_value'>{item.value}</Tag>
            </div>;
          }) : <span style={{ marginTop: '13px' }}>0个</span>}
        </div>
      </div>
      <div>
        <div className='fz_16 fw_bold SecretUpdate' style={{ marginBottom: '32px' }}>
          数据
        </div>
        {dataInfo && (
          <CodeMirrorEditor ref={childCodeMirrorRef} yamlData={dataInfo} className='fit_content' />
        )}
      </div>
    </div>
  );
}
