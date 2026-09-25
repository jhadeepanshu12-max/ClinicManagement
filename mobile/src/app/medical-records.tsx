import React, { useCallback, useState } from "react";
import PatientPortalSection from "../components/PatientPortalSection";
import { useAuth } from "../context/AuthContext";

import { ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { createMedicalRecord, getAppointments, getDoctors, getMedicalRecords, getPatients } from "../api/api";

function MedicalRecords(){
 const [items,setItems]=useState<any[]>([]),[patients,setPatients]=useState<any[]>([]),[doctors,setDoctors]=useState<any[]>([]),[appointments,setAppointments]=useState<any[]>([]);
 const [show,setShow]=useState(false),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false);
 const [form,setForm]=useState({patient:"",doctor:"",appointment:"",visitDate:"",chiefComplaint:"",symptoms:"",diagnosis:"",treatmentPlan:"",clinicalNotes:"",followUpDate:"",followUpNotes:""});
 const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 const load=async()=>{try{setLoading(true);const [r,p,d,a]=await Promise.all([getMedicalRecords(),getPatients(),getDoctors(),getAppointments()]);setItems(r);setPatients(p);setDoctors(d);setAppointments(a)}catch(e:any){Alert.alert("Medical Records",e?.response?.data?.message||"Unable to load records.")}finally{setLoading(false);setRefreshing(false)}};
 useFocusEffect(useCallback(()=>{load()},[]));
 const save=async()=>{if(!form.patient||!form.doctor||!form.appointment||!form.visitDate||!form.chiefComplaint.trim()||!form.diagnosis.trim()){Alert.alert("Validation","Patient, doctor, appointment, visit date, complaint and diagnosis are required.");return}try{setSaving(true);await createMedicalRecord({...form,symptoms:form.symptoms.split(",").map(x=>x.trim()).filter(Boolean),vitals:{}});setShow(false);await load();Alert.alert("Success","Medical record created successfully.")}catch(e:any){Alert.alert("Medical Record",e?.response?.data?.message||"Unable to create record.")}finally{setSaving(false)}};
 if(show)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.c}><Text style={s.t}>New Medical Record</Text><Text style={s.sub}>Clinical visit documentation</Text>{["patient","doctor","appointment","visitDate","chiefComplaint","symptoms","diagnosis","treatmentPlan","clinicalNotes","followUpDate","followUpNotes"].map(k=><View key={k}><Text style={s.l}>{k.charAt(0).toUpperCase()+k.slice(1)}</Text><TextInput style={[s.i,["symptoms","treatmentPlan","clinicalNotes","followUpNotes"].includes(k)&&{height:80}]} multiline={["symptoms","treatmentPlan","clinicalNotes","followUpNotes"].includes(k)} value={(form as any)[k]} onChangeText={v=>set(k,v)} placeholder={["patient","doctor","appointment"].includes(k)?"Paste ID":k==="visitDate"||k==="followUpDate"?"YYYY-MM-DD":k} placeholderTextColor="#98A2B3"/></View>)}<Text style={s.hint}>{patients.length} patients • {doctors.length} doctors • {appointments.length} appointments loaded.</Text><TouchableOpacity style={s.p} onPress={save} disabled={saving}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.pt}>Create Record</Text>}</TouchableOpacity><TouchableOpacity style={s.sec} onPress={()=>setShow(false)}><Text style={s.st}>Cancel</Text></TouchableOpacity></ScrollView></SafeAreaView>;
 return <SafeAreaView style={s.safe}><View style={s.c}><View style={s.row}><View><Text style={s.t}>Medical Records</Text><Text style={s.sub}>{items.length} records</Text></View><TouchableOpacity style={s.small} onPress={()=>setShow(true)}><Text style={s.pt}>+ New</Text></TouchableOpacity></View>{loading?<ActivityIndicator color="#315FEF" style={{marginTop:40}}/>:<FlatList data={items} keyExtractor={x=>x._id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load()}}/>} renderItem={({item})=><View style={s.card}><Text style={s.ct}>{item.patient?.name||"Patient"}</Text><Text style={s.m}>{item.doctor?.user?.name||item.doctor?.name||"Doctor"} • {item.visitDate?String(item.visitDate).slice(0,10):"—"}</Text><Text style={s.m}>Diagnosis: {item.diagnosis||"—"}</Text><Text style={s.m}>{item.chiefComplaint||"No complaint"}</Text></View>} ListEmptyComponent={<Text style={s.empty}>No medical records found.</Text>}/>}</View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#F5F7FB"},c:{padding:18,paddingBottom:40,flexGrow:1},t:{fontSize:28,fontWeight:"900",color:"#172033"},sub:{fontSize:13,color:"#7B8798",marginBottom:15},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:15},l:{fontSize:12,fontWeight:"800",color:"#4B5565",marginTop:6,marginBottom:6},i:{backgroundColor:"#fff",borderWidth:1,borderColor:"#E5EAF1",borderRadius:12,height:48,paddingHorizontal:14,color:"#172033",marginBottom:8},hint:{fontSize:11,color:"#7B8798",marginVertical:8},p:{height:50,borderRadius:12,backgroundColor:"#315FEF",alignItems:"center",justifyContent:"center",marginTop:10},pt:{color:"#fff",fontWeight:"900"},sec:{height:50,borderRadius:12,backgroundColor:"#E9EDF4",alignItems:"center",justifyContent:"center",marginTop:10},st:{color:"#334155",fontWeight:"800"},small:{backgroundColor:"#315FEF",paddingHorizontal:15,paddingVertical:11,borderRadius:11},card:{backgroundColor:"#fff",borderRadius:16,padding:15,marginBottom:10},ct:{fontSize:15,fontWeight:"900",color:"#172033"},m:{fontSize:12,color:"#7B8798",marginTop:4},empty:{textAlign:"center",marginTop:40,color:"#7B8798"}})


export default function MedicalRecordsScreen() {
  const role = useAuthRole();
  if (role === "patient") return <PatientPortalSection section="medical-records" />;
  return <MedicalRecords />;
}

function useAuthRole() {
  const { user } = useAuth();
  return String(user?.role || "").toLowerCase();
}
