import React, { useCallback, useState } from "react";
import PatientPortalSection from "../components/PatientPortalSection";
import { useAuth } from "../context/AuthContext";

import { ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { createAppointment, getAppointments, getDoctors, getPatients } from "../api/api";

function Appointments(){
 const [items,setItems]=useState<any[]>([]),[patients,setPatients]=useState<any[]>([]),[doctors,setDoctors]=useState<any[]>([]);
 const [show,setShow]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[refreshing,setRefreshing]=useState(false);
 const [form,setForm]=useState({patient:"",doctor:"",appointmentDate:"",appointmentTime:"",reason:"",status:"scheduled",notes:""});
 const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 const load=async()=>{try{setLoading(true);const [a,p,d]=await Promise.all([getAppointments(),getPatients(),getDoctors()]);setItems(a);setPatients(p);setDoctors(d)}catch(e:any){Alert.alert("Appointments",e?.response?.data?.message||"Unable to load appointments.")}finally{setLoading(false);setRefreshing(false)}};
 useFocusEffect(useCallback(()=>{load()},[]));
 const save=async()=>{if(!form.patient||!form.doctor||!form.appointmentDate||!form.appointmentTime||!form.reason.trim()){Alert.alert("Validation","Patient, doctor, date, time and reason are required.");return}try{setSaving(true);await createAppointment({...form,reason:form.reason.trim(),notes:form.notes.trim()});setShow(false);setForm({patient:"",doctor:"",appointmentDate:"",appointmentTime:"",reason:"",status:"scheduled",notes:""});await load();Alert.alert("Success","Appointment created successfully.")}catch(e:any){Alert.alert("Appointment",e?.response?.data?.message||"Unable to create appointment.")}finally{setSaving(false)}};
 if(show)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.c}><Text style={s.t}>New Appointment</Text><Text style={s.sub}>Schedule a patient visit</Text>
  <Text style={s.l}>Patient ID *</Text><TextInput style={s.i} value={form.patient} onChangeText={v=>set("patient",v)} placeholder="Paste patient ID" placeholderTextColor="#98A2B3"/>
  <Text style={s.l}>Doctor ID *</Text><TextInput style={s.i} value={form.doctor} onChangeText={v=>set("doctor",v)} placeholder="Paste doctor ID" placeholderTextColor="#98A2B3"/>
  <Text style={s.hint}>{patients.length} patients and {doctors.length} doctors loaded. Use IDs shown in their records.</Text>
  {["appointmentDate","appointmentTime","reason","status","notes"].map(k=><View key={k}><Text style={s.l}>{k==="appointmentDate"?"Date":k==="appointmentTime"?"Time":k.charAt(0).toUpperCase()+k.slice(1)}</Text><TextInput style={[s.i,k==="notes"&&{height:90}]} multiline={k==="notes"} value={(form as any)[k]} onChangeText={v=>set(k,v)} placeholder={k==="appointmentDate"?"YYYY-MM-DD":k==="appointmentTime"?"10:30":k} placeholderTextColor="#98A2B3"/></View>)}
  <TouchableOpacity style={s.p} onPress={save} disabled={saving}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.pt}>Create Appointment</Text>}</TouchableOpacity><TouchableOpacity style={s.sec} onPress={()=>setShow(false)}><Text style={s.st}>Cancel</Text></TouchableOpacity>
 </ScrollView></SafeAreaView>;
 return <SafeAreaView style={s.safe}><View style={s.c}><View style={s.row}><View><Text style={s.t}>Appointments</Text><Text style={s.sub}>{items.length} records</Text></View><TouchableOpacity style={s.small} onPress={()=>setShow(true)}><Text style={s.pt}>+ New</Text></TouchableOpacity></View>{loading?<ActivityIndicator color="#315FEF" style={{marginTop:40}}/>:<FlatList data={items} keyExtractor={x=>x._id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load()}}/>} renderItem={({item})=><View style={s.card}><Text style={s.ct}>{item.patient?.name||"Patient"}</Text><Text style={s.m}>{item.doctor?.user?.name||item.doctor?.name||"Doctor"}</Text><Text style={s.m}>{item.appointmentDate?String(item.appointmentDate).slice(0,10):"—"} • {item.appointmentTime||"—"}</Text><Text style={s.badge}>{item.status||"scheduled"}</Text><Text style={s.m}>{item.reason||"No reason"}</Text></View>} ListEmptyComponent={<Text style={s.empty}>No appointments found.</Text>}/>}</View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#F5F7FB"},c:{padding:18,paddingBottom:40,flexGrow:1},t:{fontSize:28,fontWeight:"900",color:"#172033"},sub:{fontSize:13,color:"#7B8798",marginBottom:15},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:15},l:{fontSize:12,fontWeight:"800",color:"#4B5565",marginBottom:6,marginTop:6},i:{backgroundColor:"#fff",borderWidth:1,borderColor:"#E5EAF1",borderRadius:12,height:48,paddingHorizontal:14,color:"#172033",marginBottom:8},hint:{fontSize:11,color:"#7B8798",marginBottom:10},p:{height:50,borderRadius:12,backgroundColor:"#315FEF",alignItems:"center",justifyContent:"center",marginTop:10},pt:{color:"#fff",fontWeight:"900"},sec:{height:50,borderRadius:12,backgroundColor:"#E9EDF4",alignItems:"center",justifyContent:"center",marginTop:10},st:{color:"#334155",fontWeight:"800"},small:{backgroundColor:"#315FEF",paddingHorizontal:15,paddingVertical:11,borderRadius:11},card:{backgroundColor:"#fff",borderRadius:16,padding:15,marginBottom:10},ct:{fontSize:15,fontWeight:"900",color:"#172033"},m:{fontSize:12,color:"#7B8798",marginTop:4},badge:{alignSelf:"flex-start",backgroundColor:"#E8EEFF",color:"#315FEF",paddingHorizontal:9,paddingVertical:5,borderRadius:8,overflow:"hidden",marginTop:7,fontWeight:"800"},empty:{textAlign:"center",marginTop:40,color:"#7B8798"}})


export default function AppointmentsScreen() {
  const role = useAuthRole();
  if (role === "patient") return <PatientPortalSection section="appointments" />;
  return <Appointments />;
}

function useAuthRole() {
  const { user } = useAuth();
  return String(user?.role || "").toLowerCase();
}
