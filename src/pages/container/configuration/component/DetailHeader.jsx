/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { DownOutlined } from '@ant-design/icons';
import { Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useStore } from 'openinula';
import AnnotationModal from '@/components/AnnotationModal';
import {
  updateConfigMapsLabelAnnotation,
  updateSecretLabelAnnotation,
  deleteConfigMaps,
  updateSecrets,
  deleteSecret,
  getConfigMapsDetails,
  getSecretDetails,
} from '@/api/containerApi';
import { solveAnnotationOrLabelDiff } from '@/tools/utils';
import { containerRouterPrefix } from '@/constant.js';
import { useHistory } from 'inula-router';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { solveAnnotation, forbiddenMsg } from '@/tools/utils';

export default function DetailHeader({
  type,
  title,
  configurationData,
  secretData,
  secretNameSpace,
  secretName,
  secretLoading,
  configurationLoading,
  configurationNameSpace,
  configurationName,
  getConfigMapsDetailsInfo,
  getSecretDetailsInfo,
  onEdit,
}) {
  const [podPopOpen, setPodPopOpen] = useState(false);
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const history = useHistory();
  const [podDelModalOpen, setPodDelModalOpen] = useState(false); // 删除对话框展示
  const [podDelName, setPodDelName] = useState(''); // 删除的名称
  const [podDelNamespace, setPodDelNamespace] = useState(''); // 删除的命名空间
  const [isPodDelCheck, setIsPodDelCheck] = useState(false); // 是否选中
  const [oldConfigMapAnnotations, setOldConfigMapAnnotataions] = useState([]); // 未修改前注解
  const [oldConfigMapLabels, setOldConfigMapLabels] = useState([]);
  const [oldSecretAnnotations, setOldSecretAnnotataions] = useState([]); // 未修改前注解
  const [oldSecretLabels, setOldSecretLabels] = useState([]);
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0px 32px 0 32px',
    background: '#fff',
    alignItems: 'flex-start',
    backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff',
  };
  const getConfigMapsDetailsInfoData = async () => {
    try {
      const res = await getConfigMapsDetails(
        configurationNameSpace,
        configurationName
      );
      if (res.status === 200) {
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldConfigMapAnnotataions([...res.data.metadata.annotations]);
        setOldConfigMapLabels([...res.data.metadata.labels]);
      }
    } catch (error) {
      messageApi.error(error.response?.data?.message);
    }
  };

  const getSecretDetailsInfoData = async () => {
    try {
      const res = await getSecretDetails(secretNameSpace, secretName);
      if (res.status === 200) {
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldSecretAnnotataions([...res.data.metadata.annotations]);
        setOldSecretLabels([...res.data.metadata.labels]);
      }
    } catch (error) {
      messageApi.error(error.response?.data?.message);
    };
  };

  const handlePodPopOpenChange = (newOpen) => {
    setPodPopOpen(newOpen);
  };

  const handleEditAnnotation = () => {
    setAnnotationOpen(true);
  };

  const handleEditLabel = () => {
    setLabelOpen(true);
  };

  const handleDelete = async () => {
    setPodDelModalOpen(true); // 打开弹窗
    setIsPodDelCheck(false);
    if (type === 'configMap') {
      setPodDelName(configurationName);
      setPodDelNamespace(configurationNameSpace);
    } else {
      setPodDelName(secretName);
      setPodDelNamespace(secretNameSpace);
    }
  };

  const handleDelPodConfirm = async () => {
    if (type === 'configMap') {
      try {
        const res = await deleteConfigMaps(
          podDelNamespace,
          podDelName,
        );
        if (res.status === 200) {
          messageApi.success('删除成功！');
          setPodDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/configuration/configMap`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(error.response.data.message);
        }
      };
    } else {
      try {
        const res = await deleteSecret(
          podDelNamespace,
          podDelName,
        );
        if (res.status === 200) {
          messageApi.success('删除成功！');
          setPodDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/configuration/secret`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(error.response.data.message);
        }
      }
    }
  };

  const handlePodCheckFn = (e) => {
    setIsPodDelCheck(e.target.checked);
  };

  const handleDelPodCancel = () => {
    setPodDelModalOpen(false);
    setPodDelName('');
    setPodDelNamespace('');
  };

  const handleAnnotationOk = async (data) => {
    if (type === 'configMap') {
      if (JSON.stringify(oldConfigMapAnnotations) === JSON.stringify(data)) {
        messageApi.info('注解未进行修改');
        setAnnotationOpen(false);
        return;
      };
      const keyArrConfigMap = [];
      data.map(item => keyArrConfigMap.push(item.key));
      if (keyArrConfigMap.filter((item, index) => keyArrConfigMap.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
        return;
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldConfigMapAnnotations, data, 'annotation');
        try {
          const res = await updateConfigMapsLabelAnnotation(configurationNameSpace, addAnnotationList, configurationName);
          messageApi.success('编辑注解成功');
          setTimeout(() => {
            getConfigMapsDetailsInfo(); // 先刷新防止页面抖动
            setAnnotationOpen(false);
          }, 1000);
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败！${error.response.data.message}`);
          }
        };
      };
    } else {
      if (JSON.stringify(oldSecretAnnotations) === JSON.stringify(data)) {
        messageApi.info('注解未进行修改');
        setAnnotationOpen(false);
        return;
      }
      const keyArrConfigMap = [];
      data.map(item => keyArrConfigMap.push(item.key));
      if (keyArrConfigMap.filter((item, index) => keyArrConfigMap.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
        return;
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldSecretAnnotations, data, 'annotation');
        try {
          const res = await updateSecretLabelAnnotation(secretNameSpace, addAnnotationList, secretName);
          messageApi.success('编辑注解成功');
          setTimeout(() => {
            getSecretDetailsInfo(); // 先刷新防止页面抖动
            setAnnotationOpen(false);
          }, 1000);
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败！${error.response?.data.message}`);
          }
        };
      };
    }
  };

  const handleLabelOk = async (data) => {
    if (type === 'configMap') {
      if (JSON.stringify(oldConfigMapLabels) === JSON.stringify(data)) {
        messageApi.info('标签未进行修改');
        setLabelOpen(false);
        return;
      }
      const keyArrDetail = [];
      data.map(item => keyArrDetail.push(item.key));
      if (keyArrDetail.filter((item, index) => keyArrDetail.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
        return;
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的标签
        const addLabelList = solveAnnotationOrLabelDiff(oldConfigMapLabels, data, 'label');
        try {
          const res = await updateConfigMapsLabelAnnotation(configurationNameSpace, addLabelList, configurationName);
          messageApi.success('编辑标签成功');
          setTimeout(() => {
            getConfigMapsDetailsInfo();
            setLabelOpen(false);
          }, 1000);
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        };
      };
    } else {
      if (JSON.stringify(oldSecretLabels) === JSON.stringify(data)) {
        messageApi.info('标签未进行修改');
        setLabelOpen(false);
        return;
      }
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
        return;
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的标签
        const addLabelList = solveAnnotationOrLabelDiff(oldSecretLabels, data, 'label');
        try {
          const res = await updateSecretLabelAnnotation(secretNameSpace, addLabelList, secretName);
          messageApi.success('编辑标签成功');
          setTimeout(() => {
            getSecretDetailsInfo();
            setLabelOpen(false);
          }, 1000);
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response?.data.message}`);
          }
        };
      };
    }
  };

  const handleEdit = () => {
    onEdit();
  };

  useEffect(() => {
    if (secretNameSpace && secretName) {
      getSecretDetailsInfoData();
    };
  }, [secretNameSpace, secretName]);

  useEffect(() => {
    if (configurationNameSpace && configurationName) {
      getConfigMapsDetailsInfoData();
    };
  }, [configurationNameSpace, configurationName]);

  return (
    <div style={headerStyle}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div style={{
        fontSize: '20px', fontWeight: 'bold',
        wordBreak: 'break-all',
        color: themeStore.$s.theme !== 'light' && '#fff',
      }} className='clamp_2'>{title}</div>
      <Popover
        placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type='link' onClick={handleEdit}>修改</Button>
            <Button type='link' onClick={handleEditAnnotation}>
              编辑注解
            </Button>
            <Button type='link' onClick={handleEditLabel}>
              编辑标签
            </Button>
            <Button type='link' onClick={handleDelete}>
              删除
            </Button>
          </Space>
        }
        open={podPopOpen}
        onOpenChange={handlePodPopOpenChange}
      >
        <Button className='primary_btn'>
          操作 <DownOutlined className='small_margin_adjust' />
        </Button>
      </Popover>
      {(type === 'configMap' ? configurationLoading : secretLoading) && (
        <AnnotationModal
          type='annotation'
          open={annotationOpen}
          dataList={
            type === 'configMap'
              ? configurationData?.metadata.annotations
              : secretData?.metadata.annotations
          }
          callbackCancel={() => setAnnotationOpen(false)}
          callbackOk={handleAnnotationOk}
        />
      )}

      {(type === 'configMap' ? configurationLoading : secretLoading) && (
        <AnnotationModal
          type='label'
          open={labelOpen}
          callbackCancel={() => setLabelOpen(false)}
          dataList={
            type === 'configMap'
              ? configurationData?.metadata.labels
              : secretData?.metadata.labels
          }
          callbackOk={handleLabelOk}
        />
      )}
      <DeleteInfoModal
        title={`${type === 'configMap' ? '删除ConfigMap' : '删除Secret'}`}
        open={podDelModalOpen}
        cancelFn={handleDelPodCancel}
        content={[
          `删除${type === 'configMap' ? 'ConfigMap' : 'Secret'}后将无法恢复，请谨慎操作。`,
          `确定删除${type === 'configMap' ? 'ConfigMap' : 'Secret'} ${podDelName} 吗？`,
        ]}
        isCheck={isPodDelCheck}
        showCheck={true}
        checkFn={handlePodCheckFn}
        confirmFn={handleDelPodConfirm}
      />
    </div>
  );
}
